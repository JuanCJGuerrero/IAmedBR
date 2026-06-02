import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from document_parser import parse_document


def test_rg_basic_fields():
    raw = """
    REPUBLICA FEDERATIVA DO BRASIL
    REGISTRO GERAL
    NOME: MARIA SILVA SANTOS
    CPF 390.533.447-05
    RG 12.345.678-9
    DATA DE NASCIMENTO: 15/03/1990
    FILIACAO
    MAE: ANA SANTOS
    PAI: JOAO SILVA
    ORGAO EMISSOR SSP/SP
    """.strip()

    data = parse_document(raw)
    assert data.document_type == "RG"
    assert data.name == "Maria Silva Santos"
    assert data.cpf == "390.533.447-05"
    assert data.rg == "12.345.678-9"
    assert data.birth_date == "15/03/1990"
    assert data.mother_name == "Ana Santos"
    assert data.father_name == "Joao Silva"


def test_cnh_fields_and_category():
    raw = """
    CARTEIRA NACIONAL DE HABILITACAO
    NOME: CARLOS EDUARDO PEREIRA
    CPF 390.533.447-05
    REGISTRO 00123456789
    CATEGORIA B
    DATA DE NASCIMENTO 07/07/1987
    EMISSAO 01/01/2015
    VALIDADE 01/01/2025
    DETRAN SP
    """.strip()

    data = parse_document(raw)
    assert data.document_type == "CNH"
    assert data.name == "Carlos Eduardo Pereira"
    assert data.cpf == "390.533.447-05"
    assert data.cnh_number == "00123456789"
    assert data.cnh_category == "B"
    assert data.birth_date == "07/07/1987"
    assert data.issue_date == "01/01/2015"
    assert data.expiry_date == "01/01/2025"


def test_date_classification_keywords():
    raw = """
    IDENTIDADE
    NOME: JOANA COSTA
    NASCIMENTO 10/11/1992
    DATA DE EXPEDICAO 22/04/2010
    VALIDADE 22/04/2020
    """.strip()

    data = parse_document(raw)
    assert data.birth_date == "10/11/1992"
    assert data.issue_date == "22/04/2010"
    assert data.expiry_date == "22/04/2020"


def test_invalid_cpf_not_returned():
    raw = """
    REGISTRO GERAL
    NOME: TESTE INVALIDO
    CPF 111.111.111-11
    RG 12.345.678-9
    """.strip()

    data = parse_document(raw)
    assert data.cpf is None
    assert data.rg == "12.345.678-9"
