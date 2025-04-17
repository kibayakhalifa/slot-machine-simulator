// Game Configuration
const config = {
    ROWS: 3,
    COLS: 3,
    SYMBOLS: {
      '🍒': { count: 2, value: 5 },
      '🍋': { count: 4, value: 4 },
      '🍊': { count: 6, value: 3 },
      '🍇': { count: 8, value: 2 }
    },
    SPIN_DELAY: 100,
    WIN_ANIMATION_DURATION: 1500
  };
  
  // Game State
  let balance = 0;
  let isSpinning = false;
  
  // DOM Elements
  const depositInput = document.getElementById('deposit');
  const linesInput = document.getElementById('lines');
  const linesValue = document.getElementById('lines-value');
  const betInput = document.getElementById('bet');
  const spinBtn = document.getElementById('spin-btn');
  const statusEl = document.getElementById('status');
  const balanceEl = document.getElementById('balance');
  const resultEl = document.getElementById('result');
  const rowsEl = document.getElementById('rows');
  
  // Initialize the game
  function init() {
    // Set up event listeners
    linesInput.addEventListener('input', updateLinesValue);
    updateBalance();
    
    // Set default bet
    betInput.value = 1;
  }
  
  // Update displayed lines value
  function updateLinesValue() {
    linesValue.textContent = linesInput.value;
  }
  
  // Set deposit amount
  function setDeposit() {
    if (isSpinning) return;
    
    const amount = parseFloat(depositInput.value);
    
    if (!isNaN(amount) && amount > 0) {
      balance += amount;
      updateBalance();
      showMessage(`Deposited $${amount.toFixed(2)}`, 'success');
      depositInput.value = '';
    } else {
      showMessage('Please enter a valid amount', 'error');
      depositInput.focus();
    }
  }
  
  // Set bet amount
  function setBet(amount) {
    if (isSpinning) return;
    
    const currentBet = parseFloat(betInput.value) || 0;
    const newBet = currentBet + amount;
    
    if (newBet > 0) {
      betInput.value = newBet;
    }
  }
  
  // Main game function
  function playGame() {
    if (isSpinning) return;
    
    const lines = parseInt(linesInput.value);
    const bet = parseFloat(betInput.value);
    const totalBet = bet * lines;
    
    // Validate inputs
    if (isNaN(lines) || lines < 1 || lines > 3) {
      showMessage('Please select 1-3 paylines', 'error');
      return;
    }
    
    if (isNaN(bet) || bet <= 0) {
      showMessage('Please enter a valid bet amount', 'error');
      betInput.focus();
      return;
    }
    
    if (totalBet > balance) {
      showMessage(`Not enough balance for $${totalBet.toFixed(2)} bet`, 'error');
      return;
    }
    
    // Deduct bet from balance
    balance -= totalBet;
    updateBalance();
    
    // Start spinning animation
    isSpinning = true;
    spinBtn.disabled = true;
    showMessage('Spinning...', 'info');
    
    // Show spinning animation
    spinAnimation().then(() => {
      // Get final spin result
      const reels = spin();
      const rows = transpose(reels);
      displayRows(rows);
      
      // Calculate winnings
      const winnings = getWinnings(rows, bet, lines);
      balance += winnings;
      
      // Display result
      if (winnings > 0) {
        resultEl.textContent = `You won $${winnings.toFixed(2)}!`;
        resultEl.className = 'result-message win';
        showMessage('Winner!', 'success');
        
        // Add confetti effect for big wins
        if (winnings >= totalBet * 5) {
          triggerConfetti();
        }
      } else {
        resultEl.textContent = 'Try again!';
        resultEl.className = 'result-message lose';
        showMessage('No win this time', 'info');
      }
      
      updateBalance();
      isSpinning = false;
      spinBtn.disabled = false;
    });
  }
  
  // Spin animation
  function spinAnimation() {
    return new Promise(resolve => {
      let spins = 0;
      const maxSpins = 10;
      
      const spinInterval = setInterval(() => {
        // Generate random symbols for animation
        const tempRows = [];
        for (let i = 0; i < config.ROWS; i++) {
          const symbols = Object.keys(config.SYMBOLS);
          const row = [];
          for (let j = 0; j < config.COLS; j++) {
            const randomIndex = Math.floor(Math.random() * symbols.length);
            row.push(symbols[randomIndex]);
          }
          tempRows.push(row);
        }
        
        displayRows(tempRows);
        spins++;
        
        if (spins >= maxSpins) {
          clearInterval(spinInterval);
          setTimeout(resolve, 300); // Small delay before showing final result
        }
      }, config.SPIN_DELAY);
    });
  }
  
  // Generate spin result
  function spin() {
    const symbols = [];
    
    // Create array of all symbols based on their counts
    for (const [symbol, data] of Object.entries(config.SYMBOLS)) {
      for (let i = 0; i < data.count; i++) {
        symbols.push(symbol);
      }
    }
    
    const reels = [];
    
    // For each reel (column)
    for (let i = 0; i < config.COLS; i++) {
      reels.push([]);
      const reelSymbols = [...symbols];
      
      // For each row in the reel
      for (let j = 0; j < config.ROWS; j++) {
        const randomIndex = Math.floor(Math.random() * reelSymbols.length);
        reels[i].push(reelSymbols[randomIndex]);
        reelSymbols.splice(randomIndex, 1);
      }
    }
    
    return reels;
  }
  
  // Transpose reels into rows for display
  function transpose(reels) {
    const rows = [];
    
    for (let i = 0; i < config.ROWS; i++) {
      rows.push([]);
      for (let j = 0; j < config.COLS; j++) {
        rows[i].push(reels[j][i]);
      }
    }
    
    return rows;
  }
  
  // Display the rows in the UI
  function displayRows(rows) {
    rowsEl.innerHTML = '';
    
    for (const row of rows) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'slot-row';
      
      row.forEach(symbol => {
        const symbolSpan = document.createElement('span');
        symbolSpan.textContent = symbol;
        symbolSpan.className = 'symbol';
        rowDiv.appendChild(symbolSpan);
      });
      
      rowsEl.appendChild(rowDiv);
    }
  }
  
  // Calculate winnings
  function getWinnings(rows, bet, lines) {
    let winnings = 0;
    
    for (let row = 0; row < lines; row++) {
      const symbols = rows[row];
      
      // Check if all symbols in the row are the same
      const allSame = symbols.every(s => s === symbols[0]);
      
      if (allSame) {
        const symbol = symbols[0];
        winnings += bet * config.SYMBOLS[symbol].value;
      }
    }
    
    return winnings;
  }
  
  // Update balance display
  function updateBalance() {
    balanceEl.textContent = `Balance: $${balance.toFixed(2)}`;
    
    // Change color based on balance
    if (balance <= 0) {
      balanceEl.className = 'balance-low';
    } else if (balance > 50) {
      balanceEl.className = 'balance-high';
    } else {
      balanceEl.className = '';
    }
  }
  
  // Show status message
  function showMessage(message, type = 'info') {
    statusEl.textContent = message;
    statusEl.className = `status-message status-${type}`;
  }
  
  // Simple confetti effect
  function triggerConfetti() {
    const confettiCount = 50;
    const container = document.querySelector('.container');
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.backgroundColor = getRandomColor();
      confetti.style.animationDuration = `${Math.random() * 3 + 2}s`;
      container.appendChild(confetti);
      
      // Remove confetti after animation
      setTimeout(() => {
        confetti.remove();
      }, 3000);
    }
  }
  
  function getRandomColor() {
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  // Initialize the game when DOM is loaded
  document.addEventListener('DOMContentLoaded', init);