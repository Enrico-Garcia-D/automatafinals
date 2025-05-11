
    function simulateAutomaton() {
      const states = document.getElementById('states').value.split(',');
      const alphabet = document.getElementById('alphabet').value.split(',');
      const startState = document.getElementById('startState').value;
      const acceptStates = document.getElementById('acceptStates').value.split(',');
      const transitionsRaw = document.getElementById('transitions').value.trim().split('\n');
      const inputString = document.getElementById('inputString').value;

      const transitions = {};
      for (let state of states) {
        transitions[state] = {};
        for (let symbol of alphabet) {
          transitions[state][symbol] = null;
        }
      }

      for (let line of transitionsRaw) {
        const [left, right] = line.split('->');
        const [from, symbol] = left.split(',');
        const to = right.trim();
        transitions[from][symbol] = to;
      }

      const stepsContainer = document.getElementById('steps');
      stepsContainer.innerHTML = '';
      document.getElementById('result').innerText = '';

      let currentState = startState;
      const steps = [];
      let haltedEarly = false;

      for (let i = 0; i < inputString.length; i++) {
        const symbol = inputString[i];
        const nextState = transitions[currentState][symbol];
        if (!nextState) {
          steps.push(`${currentState} --${symbol}--> undefined`);
          haltedEarly = true;
          break;
        }
        steps.push(`${currentState} --${symbol}--> ${nextState}`);
        currentState = nextState;
      }

      let stepIndex = 0;
      function showNextStep() {
        if (stepIndex < steps.length) {
          const li = document.createElement('li');
          li.innerText = steps[stepIndex];
          stepsContainer.appendChild(li);

          drawStateDiagram(states, transitions, steps[stepIndex].split(' --')[0]);

          // Highlight corresponding table cell
          const [fromSymbol, to] = steps[stepIndex].split('--')[1].split('-->');
          const from = steps[stepIndex].split(' --')[0];
          const symbol = fromSymbol.trim();
          const cellId = `cell-${from}-${symbol}`;
          const cell = document.getElementById(cellId);
          if (cell) {
            cell.classList.add('highlight');
            setTimeout(() => {
              cell.classList.remove('highlight');
            }, 1000); // Remove highlight after 1s
          }

          stepIndex++;
          setTimeout(showNextStep, 1000);
        } else {
          drawStateDiagram(states, transitions, currentState);
          if (!haltedEarly && stepIndex === inputString.length) {
            document.getElementById('result').innerText =
              acceptStates.includes(currentState) ? 'Accepted ✅' : 'Rejected ❌';
          } else {
            document.getElementById('result').innerText = 'Rejected ❌ (incomplete transition)';
          }
        }
      }

      showNextStep();

      drawTransitionTable(states, alphabet, transitions);
    }

    function drawStateDiagram(states, transitions, active) {
      const svgNS = 'http://www.w3.org/2000/svg';
      const diagram = document.getElementById('stateDiagram');
      diagram.innerHTML = '';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('width', 600);
      svg.setAttribute('height', 200);

      const statePos = {};
      const radius = 20;
      const spacing = 150;

      states.forEach((state, i) => {
        const x = 50 + i * spacing;
        const y = 100;
        statePos[state] = { x, y };

        const circle = document.createElementNS(svgNS, 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', radius);
        circle.setAttribute('stroke', 'black');
        circle.setAttribute('fill', state === active ? 'yellow' : 'white');
        svg.appendChild(circle);

        const text = document.createElementNS(svgNS, 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y + 4);
        text.textContent = state;
        svg.appendChild(text);
      });

      for (let from in transitions) {
        for (let symbol in transitions[from]) {
          const to = transitions[from][symbol];
          if (to && statePos[to]) {
            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', statePos[from].x);
            line.setAttribute('y1', statePos[from].y);
            line.setAttribute('x2', statePos[to].x);
            line.setAttribute('y2', statePos[to].y);
            line.setAttribute('stroke', 'black');
            svg.appendChild(line);

            const midX = (statePos[from].x + statePos[to].x) / 2;
            const midY = (statePos[from].y + statePos[to].y) / 2 - 10;
            const label = document.createElementNS(svgNS, 'text');
            label.setAttribute('x', midX);
            label.setAttribute('y', midY);
            label.setAttribute('font-size', '10');
            label.textContent = symbol;
            svg.appendChild(label);
          }
        }
      }

      diagram.appendChild(svg);
    }

    function drawTransitionTable(states, alphabet, transitions) {
      const tableContainer = document.getElementById('transitionTable');
      tableContainer.innerHTML = '';

      const table = document.createElement('table');
      const headerRow = document.createElement('tr');

      const thState = document.createElement('th');
      thState.innerText = 'State';
      headerRow.appendChild(thState);

      alphabet.forEach(symbol => {
        const th = document.createElement('th');
        th.innerText = symbol;
        headerRow.appendChild(th);
      });

      table.appendChild(headerRow);

      states.forEach(state => {
        const row = document.createElement('tr');
        const tdState = document.createElement('td');
        tdState.innerText = state;
        row.appendChild(tdState);

        alphabet.forEach(symbol => {
          const td = document.createElement('td');
          td.innerText = transitions[state][symbol] || '-';
          td.id = `cell-${state}-${symbol}`;
          row.appendChild(td);
        });

        table.appendChild(row);
      });

      tableContainer.appendChild(table);
    }