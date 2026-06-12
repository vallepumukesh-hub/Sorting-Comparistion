let state = {
    bubbleTrace: [],
    mergeTrace: [],
    bubbleStep: 0,
    mergeStep: 0,
    isPlaying: false,
    intervalId: null,
    points: 0,
    predictedWinner: null,
    raceFinished: false,
    maxVal: 100,
    complexityChart: null
};

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    setupEventListeners();
    updateCalculator();
});

function setupEventListeners() {
    document.getElementById('sort-btn').addEventListener('click', startRace);

    // Playback
    document.getElementById('btn-play-pause').addEventListener('click', togglePlay);
    document.getElementById('btn-prev').addEventListener('click', stepBackward);
    document.getElementById('btn-next').addEventListener('click', stepForward);
    document.getElementById('btn-restart').addEventListener('click', restartRace);

    // Quick Actions
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            let arr = [];
            if (action === 'rand5') arr = generateRandom(5);
            else if (action === 'rand10') arr = generateRandom(10);
            else if (action === 'rand20') arr = generateRandom(20);
            else if (action === 'sorted') arr = Array.from({length: 15}, (_, i) => i + 1);
            else if (action === 'reversed') arr = Array.from({length: 15}, (_, i) => 15 - i);

            document.getElementById('numbers-input').value = arr.join(', ');
        });
    });

    // Complexity Graph
    document.getElementById('n-slider').addEventListener('input', (e) => {
        document.getElementById('n-value').textContent = e.target.value;
        updateChart(e.target.value);
    });

    // Calculator
    document.getElementById('calc-btn').addEventListener('click', updateCalculator);
}

function generateRandom(n) {
    const arr = [];
    for(let i=0; i<n; i++) arr.push(Math.floor(Math.random() * 100) + 1);
    return arr;
}

function startRace() {
    const inputVal = document.getElementById('numbers-input').value.trim();
    if (!inputVal) {
        showError("Please enter some numbers first!");
        return;
    }

    const numbers = inputVal.split(',').map(n => parseInt(n.trim()));
    if (numbers.some(isNaN)) {
        showError("Oops! Make sure you only enter numbers separated by commas.");
        return;
    }
    if (numbers.length > 50) {
        showError("For visualization, please keep the list under 50 numbers. Use the calculator for larger numbers!");
        return;
    }

    hideError();
    document.getElementById('visualization-section').classList.remove('hidden');

    // Get Prediction
    const guessRadios = document.getElementsByName('winner-guess');
    state.predictedWinner = null;
    for (let radio of guessRadios) {
        if (radio.checked) state.predictedWinner = radio.value;
    }

    state.maxVal = Math.max(...numbers);
    
    // Generate Traces
    state.bubbleTrace = getBubbleSortTrace(numbers);
    state.mergeTrace = getMergeSortTrace(numbers);
    
    // Reset State
    state.bubbleStep = 0;
    state.mergeStep = 0;
    state.raceFinished = false;
    document.getElementById('winner-announcement').classList.add('hidden');
    document.getElementById('tutor-explanation').innerHTML = "Waiting for the race to finish...";
    document.getElementById('game-result').className = 'hidden result-banner';
    
    renderAll();
    
    // Auto Play
    if (!state.isPlaying) {
        togglePlay();
    }
}

function togglePlay() {
    if (state.isPlaying) {
        clearInterval(state.intervalId);
        state.isPlaying = false;
        document.getElementById('btn-play-pause').innerHTML = "▶ Play";
    } else {
        if (state.raceFinished) restartRace();
        state.isPlaying = true;
        document.getElementById('btn-play-pause').innerHTML = "⏸ Pause";
        state.intervalId = setInterval(() => {
            let advanced = false;
            if (state.bubbleStep < state.bubbleTrace.length - 1) {
                state.bubbleStep++;
                advanced = true;
            }
            if (state.mergeStep < state.mergeTrace.length - 1) {
                state.mergeStep++;
                advanced = true;
            }
            
            if (advanced) {
                renderAll();
            } else {
                finishRace();
            }
        }, 150); // Speed
    }
}

function stepForward() {
    if (state.isPlaying) togglePlay();
    let advanced = false;
    if (state.bubbleStep < state.bubbleTrace.length - 1) { state.bubbleStep++; advanced = true; }
    if (state.mergeStep < state.mergeTrace.length - 1) { state.mergeStep++; advanced = true; }
    if (advanced) renderAll();
    if (state.bubbleStep === state.bubbleTrace.length - 1 && state.mergeStep === state.mergeTrace.length - 1) {
        finishRace();
    }
}

function stepBackward() {
    if (state.isPlaying) togglePlay();
    if (state.bubbleStep > 0) state.bubbleStep--;
    if (state.mergeStep > 0) state.mergeStep--;
    state.raceFinished = false;
    document.getElementById('winner-announcement').classList.add('hidden');
    renderAll();
}

function restartRace() {
    if (state.isPlaying) togglePlay();
    state.bubbleStep = 0;
    state.mergeStep = 0;
    state.raceFinished = false;
    document.getElementById('winner-announcement').classList.add('hidden');
    document.getElementById('game-result').className = 'hidden result-banner';
    renderAll();
}

// ---- Render Functions ---- //

function renderAll() {
    renderArray('bubble-viz', state.bubbleTrace[state.bubbleStep]);
    renderArray('merge-viz', state.mergeTrace[state.mergeStep]);
    updateRaceTrack();
    updateStatusTexts();
    renderRecursionTree(state.mergeTrace[state.mergeStep]);
}

function renderArray(containerId, traceStep) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    if (!traceStep) return;

    let array = traceStep.array;
    let type = traceStep.type;
    let indices = traceStep.indices || [];
    let sortedSet = traceStep.sortedSet || new Set();

    array.forEach((val, idx) => {
        let bar = document.createElement('div');
        let className = 'array-bar unsorted';
        
        if (sortedSet.has(idx)) className = 'array-bar sorted';
        
        if (type === 'compare' && indices.includes(idx)) className = 'array-bar comparing';
        if (type === 'swap' && indices.includes(idx)) className = 'array-bar swapping';

        bar.className = className;
        bar.style.height = `${(val / state.maxVal) * 100}%`;
        if (array.length <= 25) {
            bar.textContent = val;
            bar.classList.add('show-val');
        }
        
        container.appendChild(bar);
    });
}

function updateRaceTrack() {
    let bubblePct = state.bubbleTrace.length > 0 ? (state.bubbleStep / (state.bubbleTrace.length - 1)) * 100 : 0;
    let mergePct = state.mergeTrace.length > 0 ? (state.mergeStep / (state.mergeTrace.length - 1)) * 100 : 0;

    document.getElementById('bubble-progress').style.width = `${bubblePct}%`;
    document.getElementById('merge-progress').style.width = `${mergePct}%`;
    
    // Move icons
    document.getElementById('bubble-racer').style.left = `calc(${bubblePct}% + 135px - (${bubblePct} * 0.3px))`;
    document.getElementById('merge-racer').style.left = `calc(${mergePct}% + 135px - (${mergePct} * 0.3px))`;
}

function updateStatusTexts() {
    const bStep = state.bubbleTrace[state.bubbleStep];
    const mStep = state.mergeTrace[state.mergeStep];

    const bText = document.getElementById('bubble-status-text');
    const mText = document.getElementById('merge-status-text');

    if(bStep) {
        if(bStep.type === 'init') bText.textContent = "Starting...";
        else if(bStep.type === 'compare') bText.textContent = `Comparing ${bStep.array[bStep.indices[0]]} and ${bStep.array[bStep.indices[1]]}`;
        else if(bStep.type === 'swap') bText.textContent = `Swapping ${bStep.array[bStep.indices[0]]} and ${bStep.array[bStep.indices[1]]}`;
        else if(bStep.type === 'sorted') bText.textContent = "Marking sorted!";
    }

    if(mStep) {
        if(mStep.type === 'init') mText.textContent = "Starting...";
        else if(mStep.type === 'tree_split') mText.textContent = "Splitting array...";
        else if(mStep.type === 'compare') mText.textContent = `Comparing ${mStep.array[mStep.indices[0]]} and ${mStep.array[mStep.indices[1]]}`;
        else if(mStep.type === 'swap') mText.textContent = `Placing ${mStep.array[mStep.indices[0]]} into merged array`;
        else if(mStep.type === 'tree_merge') mText.textContent = "Merging subarrays...";
        else if(mStep.type === 'sorted') mText.textContent = "Subarray sorted!";
    }
}

function renderRecursionTree(mStep) {
    const container = document.getElementById('recursion-tree');
    container.innerHTML = '';
    if (!mStep || !mStep.treeNodes) return;

    // Group nodes by level
    let levels = {};
    let maxLevel = 0;
    mStep.treeNodes.forEach(n => {
        if(!levels[n.level]) levels[n.level] = [];
        levels[n.level].push(n);
        if(n.level > maxLevel) maxLevel = n.level;
    });

    for(let i=0; i<=maxLevel; i++) {
        let row = document.createElement('div');
        row.className = 'tree-level';
        if(levels[i]) {
            levels[i].forEach(n => {
                let nodeEl = document.createElement('div');
                nodeEl.className = 'tree-node';
                if(n.state === 'merged') nodeEl.classList.add('merged');
                
                // Highlight active split/merge
                if (mStep.type === 'tree_split' || mStep.type === 'tree_merge') {
                     // very basic heuristic: last added node
                     if (n.id === mStep.treeNodes[mStep.treeNodes.length-1].id) {
                         nodeEl.classList.add('active');
                     }
                }

                nodeEl.textContent = `[${n.values.join(', ')}]`;
                row.appendChild(nodeEl);
            });
        }
        container.appendChild(row);
    }
}

function finishRace() {
    if (state.raceFinished) return;
    state.raceFinished = true;
    if (state.isPlaying) togglePlay();

    let bLen = state.bubbleTrace.length;
    let mLen = state.mergeTrace.length;

    let winner = bLen < mLen ? 'bubble' : 'merge';
    let winnerName = winner === 'bubble' ? 'Bubble Sort 🫧' : 'Merge Sort 🔀';

    const ann = document.getElementById('winner-announcement');
    ann.textContent = `🏆 ${winnerName} Wins! (${Math.min(bLen, mLen)} vs ${Math.max(bLen, mLen)} operations)`;
    ann.classList.remove('hidden');

    // Tutor Explanation
    generateTutorExplanation(winner, bLen, mLen);

    // Game Logic
    if (state.predictedWinner) {
        const resultBanner = document.getElementById('game-result');
        resultBanner.classList.remove('hidden');
        if (state.predictedWinner === winner) {
            state.points += 50;
            resultBanner.textContent = "✅ Correct Prediction! You earned 50 points.";
            resultBanner.className = "result-banner correct";
        } else {
            resultBanner.textContent = "❌ Wrong prediction. Try again next time!";
            resultBanner.className = "result-banner wrong";
        }
        document.getElementById('user-points').textContent = state.points;
    }
}

function generateTutorExplanation(winner, bLen, mLen) {
    const tutor = document.getElementById('tutor-explanation');
    
    if (winner === 'bubble') {
        tutor.innerHTML = `<strong>Bubble Sort Won! 🫧</strong><br><br>
        Wow! Bubble Sort actually beat Merge Sort here. Why? Bubble Sort is highly adaptive. If the array is already sorted (or nearly sorted), it stops early after doing just a few comparisons. Merge Sort always divides and conquers, doing the same amount of work regardless of the initial order.`;
    } else {
        tutor.innerHTML = `<strong>Merge Sort Won! 🔀</strong><br><br>
        Merge Sort dominated this race because of its <strong>Divide and Conquer</strong> strategy. Instead of comparing every element side-by-side like Bubble Sort, it chops the array into tiny pieces and efficiently merges them back together. As the list gets longer, Merge Sort will almost always win!`;
    }
}

// ---- Trace Generators ---- //

function getBubbleSortTrace(arr) {
    let trace = [];
    let n = arr.length;
    let newArr = [...arr];
    let confirmedSorted = new Set();
    
    trace.push({ type: 'init', array: [...newArr], sortedSet: new Set(confirmedSorted) });

    for (let i = 0; i < n; i++) {
        let swapped = false;
        for (let j = 0; j < n - i - 1; j++) {
            trace.push({ type: 'compare', indices: [j, j+1], array: [...newArr], sortedSet: new Set(confirmedSorted) });
            if (newArr[j] > newArr[j + 1]) {
                let temp = newArr[j];
                newArr[j] = newArr[j + 1];
                newArr[j + 1] = temp;
                swapped = true;
                trace.push({ type: 'swap', indices: [j, j+1], array: [...newArr], sortedSet: new Set(confirmedSorted) });
            }
        }
        confirmedSorted.add(n - 1 - i);
        trace.push({ type: 'sorted', indices: [n - 1 - i], array: [...newArr], sortedSet: new Set(confirmedSorted) });
        if (!swapped) {
            for(let k = 0; k < n - i - 1; k++) confirmedSorted.add(k);
            trace.push({ type: 'sorted', indices: [], array: [...newArr], sortedSet: new Set(confirmedSorted) });
            break;
        }
    }
    return trace;
}

function getMergeSortTrace(arr) {
    let trace = [];
    let newArr = [...arr];
    let treeNodes = [];
    let nextNodeId = 1;
    let confirmedSorted = new Set();

    trace.push({ type: 'init', array: [...newArr], treeNodes: deepCopy(treeNodes), sortedSet: new Set() });

    function mergeSortHelper(start, end, parentId, level) {
        let nodeId = nextNodeId++;
        let segment = newArr.slice(start, end);
        
        treeNodes.push({ id: nodeId, parentId: parentId, level: level, values: [...segment], state: 'split' });
        trace.push({ type: 'tree_split', array: [...newArr], treeNodes: deepCopy(treeNodes), indices: [] });

        if (end - start <= 1) {
            let node = treeNodes.find(n => n.id === nodeId);
            if(node) node.state = 'merged';
            trace.push({ type: 'tree_merge', array: [...newArr], treeNodes: deepCopy(treeNodes), indices: [start] });
            return;
        }

        let mid = Math.floor((start + end) / 2);
        
        mergeSortHelper(start, mid, nodeId, level + 1);
        mergeSortHelper(mid, end, nodeId, level + 1);

        let L = newArr.slice(start, mid);
        let R = newArr.slice(mid, end);
        let i = 0, j = 0, k = start;
        let tempArr = [...newArr]; // track temp state while merging

        while (i < L.length && j < R.length) {
            trace.push({ type: 'compare', indices: [start + i, mid + j], array: [...tempArr], treeNodes: deepCopy(treeNodes) });
            if (L[i] <= R[j]) {
                tempArr[k] = L[i];
                i++;
            } else {
                tempArr[k] = R[j];
                j++;
            }
            trace.push({ type: 'swap', indices: [k], array: [...tempArr], treeNodes: deepCopy(treeNodes) });
            k++;
        }
        while (i < L.length) {
            tempArr[k] = L[i];
            trace.push({ type: 'swap', indices: [k], array: [...tempArr], treeNodes: deepCopy(treeNodes) });
            i++; k++;
        }
        while (j < R.length) {
            tempArr[k] = R[j];
            trace.push({ type: 'swap', indices: [k], array: [...tempArr], treeNodes: deepCopy(treeNodes) });
            j++; k++;
        }
        
        // update main array
        for(let x=start; x<end; x++) newArr[x] = tempArr[x];

        let node = treeNodes.find(n => n.id === nodeId);
        if(node) {
            node.values = newArr.slice(start, end);
            node.state = 'merged';
        }

        trace.push({ type: 'tree_merge', array: [...newArr], treeNodes: deepCopy(treeNodes), indices: [] });
    }

    mergeSortHelper(0, newArr.length, null, 0);
    
    // Mark all as sorted at the end
    for(let i=0; i<newArr.length; i++) confirmedSorted.add(i);
    trace.push({ type: 'sorted', indices: [], array: [...newArr], treeNodes: deepCopy(treeNodes), sortedSet: new Set(confirmedSorted) });

    return trace;
}

function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}


// ---- Chart & Calculator ---- //

function initChart() {
    const ctx = document.getElementById('complexityChart').getContext('2d');
    state.complexityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Bubble Sort O(n²)',
                    borderColor: '#ff7a00',
                    data: [],
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Merge Sort O(n log n)',
                    borderColor: '#6b66ff',
                    data: [],
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'List Size (n)' }, ticks: { color: '#a0a0b0' } },
                y: { title: { display: true, text: 'Operations' }, ticks: { color: '#a0a0b0' } }
            },
            plugins: {
                legend: { labels: { color: '#fff' } }
            }
        }
    });
    updateChart(100);
}

function updateChart(maxN) {
    let labels = [];
    let bData = [];
    let mData = [];
    
    let step = Math.max(1, Math.floor(maxN / 20));
    for(let n=10; n<=maxN; n+=step) {
        labels.push(n);
        bData.push(n * n);
        mData.push(Math.floor(n * Math.log2(n)));
    }

    state.complexityChart.data.labels = labels;
    state.complexityChart.data.datasets[0].data = bData;
    state.complexityChart.data.datasets[1].data = mData;
    state.complexityChart.update();
}

function updateCalculator() {
    const inputVal = document.getElementById('calc-input').value;
    let n = inputVal ? parseInt(inputVal) : 5000;
    
    let bOps = n * n;
    let mOps = Math.floor(n * Math.log2(n));

    document.getElementById('calc-bubble').textContent = bOps.toLocaleString();
    document.getElementById('calc-merge').textContent = mOps.toLocaleString();

    let diff = Math.floor(bOps / mOps);
    document.getElementById('calc-conclusion').textContent = `Merge Sort is approximately ${diff}x faster for ${n} items!`;
    document.getElementById('calc-results').classList.remove('hidden');
}

function showError(msg) {
    const errorEl = document.getElementById('error-message');
    errorEl.textContent = msg;
    errorEl.classList.remove('hidden');
}

function hideError() {
    document.getElementById('error-message').classList.add('hidden');
}
