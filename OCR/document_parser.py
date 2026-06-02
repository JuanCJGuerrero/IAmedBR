"""
document_parser.py
~~~~~~~~~~~~~~~~~~
Parser de documentos de identidade brasileiros.

Tipos suportados:
  - RG  (Registro Geral — todos os estados)
  - CNH (Carteira Nacional de Habilitação)
  - RNE / RNME (estrangeiros)
  - Passaporte brasileiro

Campos extraídos:
  nome, cpf, rg, data_nascimento, nome_pai, nome_mae,
  nacionalidade, naturalidade, data_expedicao, data_validade,
  orgao_emissor, categoria_cnh (CNH), numero_cnh (CNH)
"""

import re
import unicodedata
from dataclasses import dataclass, field
from typing import List, Optional


# ---------------------------------------------------------------------------
# Dataclass de resultado
# ---------------------------------------------------------------------------
@dataclass
class DocumentData:
    document_type: Optional[str] = None
    name: Optional[str] = None
    cpf: Optional[str] = None
    rg: Optional[str] = None
    birth_date: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    nationality: Optional[str] = None
    birth_place: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    issuing_organ: Optional[str] = None
    cnh_category: Optional[str] = None
    cnh_number: Optional[str] = None
    raw_text: str = ""


# ---------------------------------------------------------------------------
# Padrões regex
# ---------------------------------------------------------------------------
# CPF: aceita 000.000.000-00 e variações com espaço/traço omitido
_CPF_RE = re.compile(
    r'\b(\d{3})[.\s]?(\d{3})[.\s]?(\d{3})[-\s]?(\d{2})\b'
)
# RG: aceita 00.000.000-0 ou 0.000.000 (sem dígito verificador) e variações
_RG_RE = re.compile(
    r'\b(\d{1,2})[.\s]?(\d{3})[.\s]?(\d{3})[-\s]?([\dXx])?\b'
)
# Datas: dd/mm/aaaa, dd-mm-aaaa, dd.mm.aaaa
_DATE_RE = re.compile(r'\b(\d{2})[/\-.](\d{2})[/\-.](\d{4})\b')
# Número CNH (registro): 11 dígitos consecutivos
_CNH_NUM_RE = re.compile(r'\b(\d{11})\b')
# Categoria CNH: A, B, AB, AC, AD, AE, C, D, E — como palavra isolada
_CNH_CAT_RE = re.compile(r'\b(A|B|C|D|E|AB|AC|AD|AE)\b')


# ---------------------------------------------------------------------------
# Utilitários
# ---------------------------------------------------------------------------
def _normalize(text: str) -> str:
    """Remove acentos e converte para maiúsculas."""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).upper()


def _clean(text: str) -> str:
    return text.strip(" :-/\\|")


# ---------------------------------------------------------------------------
# Validação de CPF
# ---------------------------------------------------------------------------
def _validate_cpf(digits: str) -> bool:
    if len(digits) != 11 or len(set(digits)) == 1:
        return False

    def _digit(d: str, n: int) -> int:
        s = sum(int(d[i]) * (n - i) for i in range(n - 1))
        r = (s * 10) % 11
        return 0 if r >= 10 else r

    return _digit(digits, 10) == int(digits[9]) and _digit(digits, 11) == int(digits[10])


def _format_cpf(raw: str) -> str:
    d = re.sub(r"\D", "", raw)
    return f"{d[:3]}.{d[3:6]}.{d[6:9]}-{d[9:]}"


# ---------------------------------------------------------------------------
# Detecção do tipo de documento
# ---------------------------------------------------------------------------
def _detect_type(norm: str) -> str:
    if any(kw in norm for kw in ("CARTEIRA NACIONAL", "HABILITACAO", "HABILITAÇÃO", "DETRAN", "CNH")):
        return "CNH"
    if any(kw in norm for kw in ("REGISTRO GERAL", "IDENTIDADE", " RG ", "SECRETARIA DE SEGURANCA")):
        return "RG"
    if any(kw in norm for kw in ("ESTRANGEIRO", "RNE", "RNME", "MINISTERIO DA JUSTICA")):
        return "RNE"
    if any(kw in norm for kw in ("PASSAPORTE", "PASSPORT", "REPUBLICA FEDERATIVA")):
        return "Passaporte"
    return "RG"   # assume RG como fallback — documento mais comum


# ---------------------------------------------------------------------------
# Extração de campos
# ---------------------------------------------------------------------------
def _extract_cpf(text: str) -> Optional[str]:
    for m in _CPF_RE.finditer(text):
        raw = m.group()
        digits = re.sub(r"\D", "", raw)
        if _validate_cpf(digits):
            return _format_cpf(digits)
    return None


def _extract_rg(text: str, cpf_raw: Optional[str]) -> Optional[str]:
    cpf_digits = re.sub(r"\D", "", cpf_raw) if cpf_raw else ""
    for m in _RG_RE.finditer(text):
        raw = m.group()
        digits = re.sub(r"\D", "", raw)
        # Não confundir RG com CPF ou sequência muito curta
        if digits == cpf_digits:
            continue
        if len(digits) < 7:
            continue
        return raw.strip()
    return None


def _classify_dates(lines: List[str]) -> dict:
    """
    Retorna dict com birth, issue, expiry mapeando linhas que contenham
    palavras-chave próximas a datas.
    """
    result = {"birth": None, "issue": None, "expiry": None}

    birth_kw  = ("NASC", "NASCIMENTO", "DATA DE NASC", "BIRTH", "BORN")
    issue_kw  = ("EXPEDI", "EMISS", "ISSUE", "DATA DOC", "DATA DE EXPEDICAO")
    expiry_kw = ("VALID", "VENCIM", "EXPIRY", "VALIDADE", "PRAZO")

    for line in lines:
        norm_line = _normalize(line)
        dates_in_line = _DATE_RE.findall(line)
        if not dates_in_line:
            continue
        date_str = "/".join(dates_in_line[0])   # dd/mm/aaaa

        if any(kw in norm_line for kw in birth_kw) and not result["birth"]:
            result["birth"] = date_str
        elif any(kw in norm_line for kw in expiry_kw) and not result["expiry"]:
            result["expiry"] = date_str
        elif any(kw in norm_line for kw in issue_kw) and not result["issue"]:
            result["issue"] = date_str

    # Fallback: pega todas as datas em ordem e atribui se ainda vazias
    all_dates = ["/".join(m) for m in _DATE_RE.findall("\n".join(lines))]
    if not result["birth"] and all_dates:
        result["birth"] = all_dates[0]
    if not result["issue"] and len(all_dates) > 1:
        result["issue"] = all_dates[1]
    if not result["expiry"] and len(all_dates) > 2:
        result["expiry"] = all_dates[2]

    return result


def _extract_field_after_keyword(lines: List[str], keywords: List[str]) -> Optional[str]:
    """
    Procura por uma linha que contenha keyword e retorna:
      1. O conteúdo após o keyword na mesma linha, OU
      2. A linha seguinte (se o conteúdo pós-keyword for vazio/curto).
    """
    for i, line in enumerate(lines):
        norm = _normalize(line)
        for kw in keywords:
            if kw in norm:
                # tenta extrair da mesma linha
                after = re.sub(
                    rf".*{re.escape(kw)}\s*[:\-/]?\s*",
                    "",
                    norm,
                ).strip()
                after_original = re.sub(
                    rf".*{re.escape(kw)}\s*[:\-/]?\s*",
                    "",
                    line,
                    flags=re.IGNORECASE,
                ).strip(" :-")

                if len(after) > 2 and not after.isdigit():
                    return _clean(after_original).title()

                # tenta linha seguinte
                if i + 1 < len(lines):
                    nxt = lines[i + 1].strip()
                    nxt_norm = _normalize(nxt)
                    # Linha seguinte não deve ser outro keyword ou número puro
                    if len(nxt) > 2 and not nxt.isdigit() and not any(
                        k in nxt_norm for k in ("CPF", "RG", "NASC", "DATA")
                    ):
                        kw_pattern = "|".join(
                            re.escape(k) for k in sorted(keywords, key=len, reverse=True)
                        )
                        cleaned = re.sub(
                            rf"^({kw_pattern})\s*[:\-/]?\s*",
                            "",
                            nxt,
                            flags=re.IGNORECASE,
                        )
                        return _clean(cleaned).title()
    return None


def _extract_name(lines: List[str], doc_type: str) -> Optional[str]:
    name = _extract_field_after_keyword(lines, ["NOME", "NAME", "TITULAR"])
    if name:
        return name

    # Heurística: linha toda em maiúsculas com ≥ 2 palavras e sem dígitos
    for line in lines:
        stripped = line.strip()
        if (
            stripped.isupper()
            and len(stripped.split()) >= 2
            and not any(c.isdigit() for c in stripped)
            and len(stripped) > 8
            and len(stripped) < 60
        ):
            return stripped.title()
    return None


def _extract_issuing_organ(lines: List[str]) -> Optional[str]:
    organ_kw = (
        "SSP", "SESP", "DETRAN", "DGPC", "PC/", "PM/", "IFP", "IGP",
        "SECRETARIA", "MINISTERIO", "INST. DE IDENT", "POLICIA CIVIL",
    )
    for line in lines:
        norm = _normalize(line)
        if any(kw in norm for kw in organ_kw):
            return _clean(line).title()
    return None


def _extract_cnh_fields(lines: List[str], full_text: str) -> dict:
    result = {"number": None, "category": None}

    # Número de registro da CNH (11 dígitos, geralmente após "REGISTRO")
    for line in lines:
        if "REGISTRO" in _normalize(line):
            m = _CNH_NUM_RE.search(line)
            if m:
                result["number"] = m.group(1)
                break

    # Fallback: qualquer sequência de 11 dígitos
    if not result["number"]:
        m = _CNH_NUM_RE.search(full_text)
        if m:
            result["number"] = m.group(1)

    # Categoria: procura próximo a "CATEGORIA" ou "CAT"
    for line in lines:
        if any(k in _normalize(line) for k in ("CATEGORIA", " CAT ")):
            m = _CNH_CAT_RE.search(line)
            if m:
                result["category"] = m.group(1)
                break

    return result


# ---------------------------------------------------------------------------
# Função principal
# ---------------------------------------------------------------------------
def parse_document(raw_text: str) -> DocumentData:
    """
    Recebe o texto bruto do OCR e retorna um DocumentData com os campos
    identificados.
    """
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    norm_text = _normalize(raw_text)

    doc_type = _detect_type(norm_text)

    cpf = _extract_cpf(raw_text)
    rg  = _extract_rg(raw_text, cpf)

    dates = _classify_dates(lines)

    name = _extract_name(lines, doc_type)

    father = _extract_field_after_keyword(
        lines, ["PAI", "NOME DO PAI", "FATHER", "FILIACAO PAI"]
    )
    mother = _extract_field_after_keyword(
        lines, ["MAE", "NOME DA MAE", "MOTHER", "FILIACAO MAE", "FILIACAO", "FILIAÇÃO"]
    )

    nationality = _extract_field_after_keyword(
        lines, ["NACIONALIDADE", "NATIONALITY"]
    )
    birth_place = _extract_field_after_keyword(
        lines, ["NATURALIDADE", "LOCAL DE NASCIMENTO", "PLACE OF BIRTH"]
    )

    issuing_organ = _extract_issuing_organ(lines)

    cnh_fields = {}
    if doc_type == "CNH":
        cnh_fields = _extract_cnh_fields(lines, raw_text)

    return DocumentData(
        document_type=doc_type,
        name=name,
        cpf=cpf,
        rg=rg,
        birth_date=dates.get("birth"),
        father_name=father,
        mother_name=mother,
        nationality=nationality,
        birth_place=birth_place,
        issue_date=dates.get("issue"),
        expiry_date=dates.get("expiry"),
        issuing_organ=issuing_organ,
        cnh_category=cnh_fields.get("category"),
        cnh_number=cnh_fields.get("number"),
        raw_text=raw_text,
    )
