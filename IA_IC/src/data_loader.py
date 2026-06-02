import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

class DataLoader:
    def __init__(self, file_path):
        self.file_path = file_path
        self.data = None
        self.scaler = StandardScaler()

    def load_data(self):
        """Carrega o arquivo CSV ou Excel"""
        try:
            self.data = pd.read_csv(self.file_path)
            print(f"✅ Dados carregados com sucesso! Linhas: {self.data.shape[0]}")
            return self.data
        except Exception as e:
            print(f"❌ Erro ao carregar arquivo: {e}")

    def clean_data(self):
        """Limpa valores vazios e remove duplicatas"""
        if self.data is not None:
            self.data = self.data.drop_duplicates()
            self.data = self.data.dropna()
            print("🧹 Limpeza concluída (duplicatas e nulos removidos).")

    def prepare_for_training(self, target_column):
        """Separa os dados em treino e teste e normaliza"""
        X = self.data.drop(columns=[target_column])
        y = self.data[target_column]

        # Divide 80% para treino e 20% para teste
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # Normaliza os dados (importante para redes neurais)
        X_train = self.scaler.fit_transform(X_train)
        X_test = self.scaler.transform(X_test)

        return X_train, X_test, y_train, y_test

if __name__ == "__main__":
    # Exemplo de teste rápido
    # loader = DataLoader('data/raw/dados.csv')
    print("Módulo DataLoader pronto para uso.")