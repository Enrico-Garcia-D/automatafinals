 const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    // Function to parse the language input into type, value, and alphabet
    function parseLanguageInput() {
      const text = document.getElementById("languageInput").value.toLowerCase();
      const regex = /(strings that (endswith|startswith|contains) '([^']+)' over the alphabet {([^}]+)})/;
      const match = text.match(regex);
      
      if (!match) {
        alert("Invalid input format. Please follow the format: strings that [endswith|startswith|contains] '[value]' over the alphabet {[alphabet]}");
        return null;
      }

      return {
        type: match[2], // endswith, startswith, contains
        value: match[3], // the value like '01', '10', '101'
        alphabet: match[4].split(",").map(a => a.trim()) // ['0', '1']
      };
    }

    // Function to build an automaton for "endswith"
    function buildEndsWithAutomaton(value, alphabet) {
      const states = Array.from({length: value.length + 1}, (_, i) => `q${i}`);
      const transitions = {};

      for (let i = 0; i < states.length; i++) {
        transitions[states[i]] = {};
        for (const symbol of alphabet) {
          const prefix = value.slice(0, i) + symbol;
          let next = 0;
          for (let j = Math.min(value.length, prefix.length); j >= 0; j--) {
            if (prefix.endsWith(value.slice(0, j))) {
              next = j;
              break;
            }
          }
          transitions[states[i]][symbol] = `q${next}`;
        }
      }

      return {
        states,
        alphabet,
        transitions,
        start: "q0",
        accept: [`q${value.length}`]
      };
    }

    // Function to build an automaton for "startswith"
    function buildStartsWithAutomaton(value, alphabet) {
      const states = Array.from({length: value.length + 2}, (_, i) => `q${i}`);
      const transitions = {};

      for (let i = 0; i <= value.length; i++) {
        transitions[`q${i}`] = {};
        for (const symbol of alphabet) {
          if (i < value.length && symbol === value[i]) {
            transitions[`q${i}`][symbol] = `q${i + 1}`;
          } else {
            transitions[`q${i}`][symbol] = "q_dead";
          }
        }
      }

      transitions[`q${value.length}`] = {};
      for (const symbol of alphabet) {
        transitions[`q${value.length}`][symbol] = `q${value.length}`;
      }

      transitions["q_dead"] = {};
      for (const symbol of alphabet) {
        transitions["q_dead"][symbol] = "q_dead";
      }

      return {
        states: [...states, "q_dead"],
        alphabet,
        transitions,
        start: "q0",
        accept: [`q${value.length}`]
      };
    }

    // Function to build an automaton for "contains"
    function buildContainsAutomaton(value, alphabet) {
      return buildEndsWithAutomaton(value, alphabet); // Simplified approach
    }

    // Function to build the automaton from the parsed language
    function buildAutomatonFromLanguage(data) {
      if (!data.type || !data.value || !data.alphabet) {
        alert("Incomplete language definition.");
        return null;
      }
      const alphabet = data.alphabet;
      const value = data.value;

      switch (data.type) {
        case "endswith":
          return buildEndsWithAutomaton(value, alphabet);
        case "startswith":
          return buildStartsWithAutomaton(value, alphabet);
        case "contains":
          return buildContainsAutomaton(value, alphabet);
        default:
          alert("Unsupported language type.");
          return null;
      }
    }

    // Function to draw states on the canvas
    function drawStates(automaton, currentState = "") {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const spacing = canvas.width / (automaton.states.length + 1);
      automaton.states.forEach((state, index) => {
        const x = spacing * (index + 1);
        const y = canvas.height / 2;
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, 2 * Math.PI);
        ctx.fillStyle = state === currentState ? "#90ee90" : "#fff";
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#000";
        ctx.fillText(state, x - 10, y + 5);
      });
    }

    // Function to start the simulation
    async function startSimulation() {
      const input = document.getElementById("inputString").value;
      const languageData = parseLanguageInput();
      const automaton = buildAutomatonFromLanguage(languageData);

      if (!automaton) return;

      drawStates(automaton);
      document.getElementById("transitionTable").innerHTML = "";
      document.getElementById("stepOutput").textContent = "";

      let currentState = automaton.start;

      for (let i = 0; i < input.length; i++) {
        await new Promise(res => setTimeout(res, 800));
        const char = input[i];
        const nextState = automaton.transitions[currentState][char];
        document.getElementById("stepOutput").textContent =
          `Read '${char}', move from ${currentState} → ${nextState}`;
        drawStates(automaton, nextState);
        addRow(currentState, char, nextState);
        currentState = nextState;
      }

      await new Promise(res => setTimeout(res, 500));
      if (automaton.accept.includes(currentState)) {
        document.getElementById("stepOutput").textContent += "\nAccepted ✅";
      } else {
        document.getElementById("stepOutput").textContent += "\nRejected ❌";
      }
    }

    // Function to add a row to the transition table
    function addRow(from, input, to) {
      const table = document.getElementById("transitionTable");
      const row = table.insertRow();
      row.insertCell().textContent = from;
      row.insertCell().textContent = input;
      row.insertCell().textContent = to;
      if (table.rows.length === 1) {
        const header = table.createTHead().insertRow();
        header.insertCell().textContent = "From";
        header.insertCell().textContent = "Input";
        header.insertCell().textContent = "To";
      }
    }