// Conecta WebSocket automaticamente usando o IP da máquina que abriu o site
const WS_URL = `ws://${window.location.hostname}:3000/ws`;
const ws = new WebSocket(WS_URL);

// Quando o backend avisar que recebeu um zumbido
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "zumbido_received") {
        console.log("ZUMBIDO RECEBIDO!");
        vibrarTela();
        tocarSom();
    }
};

// Envia um zumbido para o outro PC (via backend → UDP)
async function enviarZumbido() {
    const targetIP = document.getElementById("ip").value;
    const targetPort = document.getElementById("port").value;

    if (!targetIP) {
        alert("Digite o IP do outro PC!");
        return;
    }

    const res = await fetch("/api/send-zumbido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetIP, targetPort })
    });

    const data = await res.json();
    alert(data.message);
}

// Animação de tremer a tela
function vibrarTela() {
    document.body.classList.add("shake");
    setTimeout(() => {
        document.body.classList.remove("shake");
    }, 500);
}

// Toca o som do zumbido
function tocarSom() {
    const audio = new Audio("zumbido.mp3");
    audio.play();
}
