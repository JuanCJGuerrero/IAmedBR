import re

class Anonimizador:
    def __init__(self):
        # Padrões básicos para dados brasileiros
        self.padrao_cpf = r'\d{3}\.\d{3}\.\d{3}-\d{2}'
        self.padrao_email = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        
    def anonimizar(self, texto):
        """Remove dados sensíveis do texto antes de enviar para a IA"""
        # 1. Remove CPF
        texto = re.sub(self.padrao_cpf, '[CPF]', texto)
        
        # 2. Remove E-mail
        texto = re.sub(self.padrao_email, '[EMAIL]', texto)
        
        # 3. Exemplo simples para Nomes (Palavras em maiúsculo que não iniciam frase)
        # Nota: Para nomes reais, o ideal é usar bibliotecas como Spacy ou Flair
        # Aqui faremos uma versão simplificada para o MVP
        return texto

    def preparar_prompt_seguro(self, nome_paciente, sintomas):
        """Prepara o texto escondendo o nome real"""
        texto_seguro = f"Paciente: [PACIENTE_ANONIMO], Sintomas: {sintomas}"
        return self.anonimizar(texto_seguro)

if __name__ == "__main__":
    # Teste rápido
    ferramenta = Anonimizador()
    teste = "O paciente Patrick Santos, cpf 123.456.789-00, sente dores fortes."
    print(ferramenta.anonimizar(teste))