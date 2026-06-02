async function gerarLaudo() {
  const sintomas = document.getElementById("sintomas").value;
  const resultado = document.getElementById("resultado");

  if (!sintomas.trim()) {
    resultado.innerHTML = " Informe os sintomas do paciente.";
    return;
  }

  resultado.innerHTML = " Gerando laudo...";

  try {
    const response = await fetch("http://127.0.0.1:8200/gerar-laudo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ sintomas })
    });

    const data = await response.json();

    resultado.innerHTML = `
      <strong>Paciente:</strong> ${data.paciente_nome}<br><br>

      <strong>Hipótese Diagnóstica:</strong><br>
      ${data.diagnostico_hipotese}<br><br>

      <strong>Exames sugeridos:</strong>
      <ul>
        ${data.exames_sugeridos.map(exame => `<li>${exame}</li>`).join("")}
      </ul>

      <strong>Recomendações:</strong><br>
      ${data.recomendacoes}<br><br>

      <strong>CID sugerido:</strong> ${data.cid_sugerido}
    `;
  } catch (error) {
    resultado.innerHTML = " Erro ao gerar laudo.";
    console.error(error);
  }
}
