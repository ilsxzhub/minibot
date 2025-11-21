// script.js (wake-word + Worker + guaranteed speaking + visual cue)
const face = document.getElementById("face");
const pupilL = document.getElementById("pupilL");
const pupilR = document.getElementById("pupilR");
const mouth = document.getElementById("mouth");

// --- EMOTIONS ---
function setEmotion(type) {
  face.className = type;
}

// --- VISUAL CUE: glow when listening ---
function showListeningCue(active) {
  if (active) {
    face.style.boxShadow = "0 0 50px #00ffea";
  } else {
    face.style.boxShadow = "0 0 40px #00b7ff";
  }
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
  if (!text || text.trim() === "") return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.pitch = 1;
  utter.rate = 1;
  utter.onstart = () => mouth.classList.add("talking");
  utter.onend = () => mouth.classList.remove("talking");
  setTimeout(() => speechSynthesis.speak(utter), 100);
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
  showListeningCue(true);
  recognition.start();
}

if (recognition) {
  recognition.onstart = () => showListeningCue(true);
  recognition.onend = () => showListeningCue(false);

  recognition.onresult = async (event) => {
    const userSpeech = event.results[0][0].transcript.toLowerCase();
    console.log("User said:", userSpeech);

    if (!userSpeech.includes("nowalk")) {
      setEmotion("neutral");
      return;
    }

    const message = userSpeech.replace("nowalk", "").trim();
    console.log("Message sent to Worker:", message);
    setEmotion("surprised");

    try {
      const replyData = await fetch("https://bloopbot-api.ethanoka94.workers.dev/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      });

      const data = await replyData.json();
      console.log("Worker replied:", data);
      const replyText = data.reply;

      if (replyText && replyText.trim() !== "") {
        let lower = replyText.toLowerCase();
        if (lower.includes("happy") || lower.includes("great") || lower.includes("awesome")) setEmotion("happy");
        else if (lower.includes("sad") || lower.includes("sorry") || lower.includes("bad")) setEmotion("sad");
        else if (lower.includes("love") || lower.includes("❤")) setEmotion("love");
        else if (lower.includes("angry") || lower.includes("mad")) setEmotion("angry");
        else setEmotion("neutral");

        speak(replyText);
      } else {
        setEmotion("neutral");
      }
    } catch (err) {
      console.error("Error contacting Worker:", err);
      setEmotion("angry");
      speak("I couldn't reach my brain.");
    }
  };

  recognition.onerror = (event) => {
    console.error("Recognition error:", event.error);
    setEmotion("neutral");
    showListeningCue(false);
  };
}
