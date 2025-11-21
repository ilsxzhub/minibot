// script.js (updated for NoWalk wake-word and your Worker URL)
const face = document.getElementById("face");
const pupilL = document.getElementById("pupilL");
const pupilR = document.getElementById("pupilR");
const mouth = document.getElementById("mouth");

// --- EMOTIONS ---
function setEmotion(type) {
  face.className = type;
}

// --- EYE TRACKING ---
document.addEventListener("mousemove", (e) => {
  let rect = face.getBoundingClientRect();
  let x = e.clientX - (rect.left + rect.width / 2);
  let y = e.clientY - (rect.top + rect.height / 2);
  const limit = 6;
  let px = Math.max(-limit, Math.min(limit, x / 25));
  let py = Math.max(-limit, Math.min(limit, y / 25));
  pupilL.style.transform = `translate(${px}px, ${py}px)`;
  pupilR.style.transform = `translate(${px}px, ${py}px)`;
});

// --- STARTUP ANIMATION ---
window.addEventListener('load', () => {
  setTimeout(() => {
    const scr = document.getElementById('startup-screen');
    scr.classList.add('fade-out');
    setTimeout(() => scr.remove(), 1200);
  }, 1500);
});

// --- SPEECH SYNTHESIS (TALK) ---
function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.pitch = 1;
  utter.rate = 1;
  utter.onstart = () => mouth.classList.add("talking");
  utter.onend = () => mouth.classList.remove("talking");
  speechSynthesis.speak(utter);
}

// --- SPEECH RECOGNITION (LISTEN) ---
let recognition;
if (window.SpeechRecognition || window.webkitSpeechRecognition) {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "en-US";
  recognition.continuous = false;
}

async function listenGPT() {
  if (!recognition) return;
  setEmotion("surprised");
  recognition.start();
}

if (recognition) {
  recognition.onresult = async (event) => {
    const userSpeech = event.results[0][0].transcript.toLowerCase();

    // Wake-word: respond only if 'nowalk' is mentioned
    if (!userSpeech.includes("nowalk")) {
      setEmotion("neutral");
      return;
    }

    const message = userSpeech.replace("nowalk", "").trim();
    setEmotion("surprised");

    // Send to your Cloudflare Worker
    const replyData = await fetch("https://bloopbot-api.ethanoka94.workers.dev/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await replyData.json();
    const replyText = data.choices[0].message.content;

    // Simple emotion detection from reply
    let lower = replyText.toLowerCase();
    if (lower.includes("happy") || lower.includes("great") || lower.includes("awesome")) setEmotion("happy");
    else if (lower.includes("sad") || lower.includes("sorry") || lower.includes("bad")) setEmotion("sad");
    else if (lower.includes("love") || lower.includes("❤")) setEmotion("love");
    else if (lower.includes("angry") || lower.includes("mad")) setEmotion("angry");
    else setEmotion("neutral");

    speak(replyText);
  };
}
