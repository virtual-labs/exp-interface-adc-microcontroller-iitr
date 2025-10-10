// ----------------- State Variables -----------------
let voltage = 2.5;
let adcValue = 0;
let hexHigh = 0;
let hexLow = 0;
let isConverting = false;
let isStartEnabled = false;

const voltageLabel = document.getElementById("voltageLabel");
const voltageSlider = document.getElementById("voltageSlider");
const convertBtn = document.getElementById("convertBtn");
const resetBtn = document.getElementById("resetBtn");
const userCodeInput = document.getElementById("userCode");

// Popups
const instructionsPopup = document.getElementById("instructionsPopup");
const readInstructionsBtn = document.getElementById("readInstructionsBtn");
const closeInstructions = document.getElementById("closeInstructions");

const circuitPopup = document.getElementById("circuitPopup");
const viewCircuitBtn = document.getElementById("viewCircuitBtn");
const closeCircuitBtn = document.getElementById("closeCircuitBtn");
const toggleDiagramBtn = document.getElementById("toggleDiagramBtn");
const cktImage = document.getElementById("cktImage");
const cktCaption = document.getElementById("cktCaption");

const samplePopup = document.getElementById("samplePopup");
const viewSampleBtn = document.getElementById("viewSampleBtn");
const closeSampleBtn = document.getElementById("closeSampleBtn");
const useSampleBtn = document.getElementById("useSampleBtn");
const sampleAsmDisplay = document.getElementById("sampleAsmDisplay");

// 7-seg placeholders
const sevenSegHigh = document.getElementById("sevenSegHigh");
const sevenSegLow = document.getElementById("sevenSegLow");

// ----------------- Sample Assembly Code -----------------
const sampleAsm = `ORG 0000H
SJMP START

SEG_TAB: DB 0C0H,0F9H,0A4H,0B0H,099H
         DB 092H,082H,0F8H,080H,090H

START:
        MOV P1, #0FFH
        MOV P2, #0FFH
        SETB P3.2
        SETB P3.6
        SETB P3.7
        SETB P3.4
        SETB P3.5

MAIN_LOOP:
        ACALL ADC_READ
        MOV R0, A

        MOV B, #51
        DIV AB
        MOV R1, A

        MOV A, B
        MOV B, #10
        MUL AB
        MOV B, #51
        DIV AB
        MOV R2, A

DISPLAY_LOOP:
        MOV DPTR, #SEG_TAB
        MOV A, R1
        MOVC A, @A+DPTR
        ANL A, #7FH
        MOV P1, A
        CLR P3.4
        SETB P3.5
        NOP
        SETB P3.4

        MOV DPTR, #SEG_TAB
        MOV A, R2
        MOVC A, @A+DPTR
        MOV P1, A
        CLR P3.5
        NOP
        SETB P3.5

        SJMP MAIN_LOOP

ADC_READ:
        CLR P3.6
        NOP
        SETB P3.6

WAIT_INTR:  
        JB P3.2, WAIT_INTR

        CLR P3.7
        MOV A, P2
        SETB P3.7
        RET

END`;

sampleAsmDisplay.textContent = sampleAsm;

// ----------------- Utility Functions -----------------
function renderSevenSeg(digit, showDecimal = false) {
  const hexToSeg = {
    0: [1,1,1,1,1,1,0], 1: [0,1,1,0,0,0,0],
    2: [1,1,0,1,1,0,1], 3: [1,1,1,1,0,0,1],
    4: [0,1,1,0,0,1,1], 5: [1,0,1,1,0,1,1],
    6: [1,0,1,1,1,1,1], 7: [1,1,1,0,0,0,0],
    8: [1,1,1,1,1,1,1], 9: [1,1,1,1,0,1,1],
  };
  const seg = hexToSeg[digit] || hexToSeg[0];
  const segStyle = (on) =>
    `fill:${on ? "#ff3333" : "#222"};stroke:#111;stroke-width:0.8;`;

  return `
    <div class="bg-black p-3 rounded-lg shadow-inner relative">
      <svg width="105" height="150" viewBox="0 0 68 100">
        <polygon points="8,5 52,5 47,12 13,12" style="${segStyle(seg[0])}"/>
        <polygon points="52,5 56,9 56,46 47,50 47,12" style="${segStyle(seg[1])}"/>
        <polygon points="47,50 56,54 56,91 52,95 47,90" style="${segStyle(seg[2])}"/>
        <polygon points="8,95 52,95 47,90 13,90" style="${segStyle(seg[3])}"/>
        <polygon points="4,54 13,50 13,90 8,95 4,91" style="${segStyle(seg[4])}"/>
        <polygon points="4,9 8,5 13,12 13,50 4,46" style="${segStyle(seg[5])}"/>
        <polygon points="13,50 47,50 42,60 18,60" style="${segStyle(seg[6])}"/>
        ${showDecimal ? `<circle cx="65" cy="92" r="4" fill="#ff3333"/>` : ""}
      </svg>
    </div>`;
}

// ----------------- Event Handlers -----------------
voltageSlider.addEventListener("input", (e) => {
  voltage = parseFloat(e.target.value);
  voltageLabel.textContent = voltage.toFixed(1) + " V";
});

// Enable Download only when user types something
userCodeInput.addEventListener("input", () => {
  if (userCodeInput.value.trim().length > 0) {
    document.getElementById("downloadBtn").disabled = false;
    document.getElementById("downloadBtn").classList.remove("btn-disabled");
    document.getElementById("downloadBtn").classList.add("btn-blue");
  } else {
    document.getElementById("downloadBtn").disabled = true;
    document.getElementById("downloadBtn").classList.remove("btn-blue");
    document.getElementById("downloadBtn").classList.add("btn-disabled");
  }
});


function startConversion() {
  if (isConverting || !isStartEnabled) return;
  isConverting = true;
  convertBtn.textContent = "Converting...";
  setTimeout(() => {
    const intPart = Math.floor(voltage);
    const decimalPart = Math.round((voltage * 10) % 10);
    hexHigh = intPart;
    hexLow = decimalPart;
    sevenSegHigh.innerHTML = renderSevenSeg(hexHigh, true);
    sevenSegLow.innerHTML = renderSevenSeg(hexLow, false);
    isConverting = false;
    convertBtn.textContent = "Convert";
  }, 200);
}

function resetSimulation() {
  isConverting = false;
  adcValue = 0;
  hexHigh = 0;
  hexLow = 0;
  userCodeInput.value = "";
  isStartEnabled = false;
  sevenSegHigh.innerHTML = renderSevenSeg(0, true);
  sevenSegLow.innerHTML = renderSevenSeg(0, false);
  convertBtn.className = "btn-disabled";
  downloadBtn.className = "btn-disabled";
}

// Popup handlers
readInstructionsBtn.onclick = () => instructionsPopup.classList.remove("hidden");
closeInstructions.onclick = () => instructionsPopup.classList.add("hidden");

viewCircuitBtn.onclick = () => circuitPopup.classList.remove("hidden");
closeCircuitBtn.onclick = () => circuitPopup.classList.add("hidden");

let showBlockDiagram = false;
toggleDiagramBtn.onclick = () => {
  showBlockDiagram = !showBlockDiagram;
  if (showBlockDiagram) {
    cktImage.src = "images/img3.png";
    cktCaption.textContent = "Figure : Block Diagram";
    toggleDiagramBtn.textContent = "View Logic Diagram";
  } else {
    cktImage.src = "images/ckt.png";
    cktCaption.textContent = "Figure : Logic Diagram";
    toggleDiagramBtn.textContent = "View Block Diagram";
  }
};

viewSampleBtn.onclick = () => samplePopup.classList.remove("hidden");
closeSampleBtn.onclick = () => samplePopup.classList.add("hidden");
useSampleBtn.onclick = () => {
  userCodeInput.value = sampleAsm;
  samplePopup.classList.add("hidden");
};

// Check Code
function normalizeAsm(code) {
  return code
    .toUpperCase()
    .split("\n")
    .map(line =>
      line.trim().replace(/\s+/g, " ").replace(/,\s+/g, ",")
    )
    .filter(line => line.length > 0)
    .join("\n");
}
document.getElementById("checkCodeBtn").onclick = () => {
  const normalizedUser = normalizeAsm(userCodeInput.value);
  const normalizedSample = normalizeAsm(sampleAsm);
  if (normalizedUser === normalizedSample) {
    alert("Your code is correct! You can proceed to next step.");
    isStartEnabled = true;
    convertBtn.className = "btn-blue";
  } else {
    alert("Your code is incorrect! Please check again.");
    isStartEnabled = false;
    convertBtn.className = "btn-disabled";
  }
};

// Download
document.getElementById("downloadBtn").onclick = () => {
  const text = userCodeInput.value || sampleAsm;
  const element = document.createElement("a");
  const file = new Blob([text], { type: "text/plain" });
  element.href = URL.createObjectURL(file);
  element.download = "adc_code.asm";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

// Convert + Reset
convertBtn.onclick = startConversion;
resetBtn.onclick = resetSimulation;

// Init 7-seg display
resetSimulation();
