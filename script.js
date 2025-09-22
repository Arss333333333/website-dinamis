// Konfigurasi yang bisa diedit
const CONFIG = {
  // Edit nama di sini
  targetName: "Lipiii -23-september-2007",

  // Edit pesan hadiah di sini (3 pesan untuk 3 kotak)
  giftMessages: [
    "Rahasia🤗",
    "Rahasia🤗",
    "Kamu dapat Kesetiaan aku❤️",
  ],

  // Pesan kalah game
  loseMessage: "walaupun kamu kalah di sini tapi di hati aku kamu tetep pemenang nya ❤️",
}

// Variabel global
let currentPage = "mainPage"
const giftOpened = [false, false, false]

let backgroundMusic = null
let isMusicPlaying = false

const tetrisGame = {
  canvas: null,
  ctx: null,
  board: [],
  currentPiece: null,
  nextPiece: null,
  score: 0,
  level: 1,
  lines: 0,
  dropTime: 0,
  lastTime: 0,
  gameRunning: false,
  gamePaused: false,
  gameLoop: null,
  dropInterval: 250, // Reduced from 400 to 250 for faster gameplay
  placedBlocks: 0,
}

const TETRIS_PIECES = [
  // I piece
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  // O piece
  [
    [2, 2],
    [2, 2],
  ],
  // T piece
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ],
  // S piece
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ],
  // Z piece
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ],
  // J piece
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ],
  // L piece
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ],
]

const TETRIS_COLORS = [
  "#000000", // 0: empty
  "#00FFFF", // 1: I piece (cyan)
  "#FFFF00", // 2: O piece (yellow)
  "#800080", // 3: T piece (purple)
  "#00FF00", // 4: S piece (green)
  "#FF0000", // 5: Z piece (red)
  "#0000FF", // 6: J piece (blue)
  "#FFA500", // 7: L piece (orange)
]

// Fungsi untuk mengganti halaman
function showPage(pageId) {
  // Sembunyikan semua halaman
  const pages = document.querySelectorAll(".page")
  pages.forEach((page) => {
    page.classList.remove("active")
  })

  // Tampilkan halaman yang dipilih
  document.getElementById(pageId).classList.add("active")
  currentPage = pageId

  if (pageId === "gamePage") {
    initTetris()
    setTimeout(addMobileControls, 100)
  } else if (pageId !== "gamePage" && tetrisGame.gameRunning) {
    // Stop game when leaving game page
    stopTetris()
  }
}

function initTetris() {
  tetrisGame.canvas = document.getElementById("tetrisCanvas")
  tetrisGame.ctx = tetrisGame.canvas.getContext("2d")

  // Initialize board (10x20)
  tetrisGame.board = Array(20)
    .fill()
    .map(() => Array(10).fill(0))

  // Reset game state
  tetrisGame.score = 0
  tetrisGame.level = 1
  tetrisGame.lines = 0
  tetrisGame.gameRunning = false
  tetrisGame.gamePaused = false
  tetrisGame.placedBlocks = 0

  updateGameInfo()
  drawBoard()
}

function startTetris() {
  if (tetrisGame.gameRunning) return

  tetrisGame.gameRunning = true
  tetrisGame.gamePaused = false
  tetrisGame.placedBlocks = 0
  tetrisGame.currentPiece = createPiece()
  tetrisGame.nextPiece = createPiece()

  document.getElementById("startBtn").disabled = true
  document.getElementById("pauseBtn").disabled = false

  tetrisGame.lastTime = 0
  requestAnimationFrame(gameLoop)
}

function pauseTetris() {
  if (!tetrisGame.gameRunning) return

  tetrisGame.gamePaused = !tetrisGame.gamePaused
  document.getElementById("pauseBtn").textContent = tetrisGame.gamePaused ? "Resume" : "Pause"

  if (!tetrisGame.gamePaused) {
    requestAnimationFrame(gameLoop)
  }
}

function stopTetris() {
  tetrisGame.gameRunning = false
  tetrisGame.gamePaused = false
  document.getElementById("startBtn").disabled = false
  document.getElementById("pauseBtn").disabled = true
  document.getElementById("pauseBtn").textContent = "Pause"
}

function createPiece() {
  const pieceIndex = Math.floor(Math.random() * TETRIS_PIECES.length)
  return {
    shape: TETRIS_PIECES[pieceIndex],
    x: Math.floor((10 - TETRIS_PIECES[pieceIndex][0].length) / 2),
    y: 0,
    color: pieceIndex + 1,
  }
}

function gameLoop(time) {
  if (!tetrisGame.gameRunning || tetrisGame.gamePaused) return

  const deltaTime = time - tetrisGame.lastTime
  tetrisGame.dropTime += deltaTime

  if (tetrisGame.dropTime > tetrisGame.dropInterval) {
    dropPiece()
    tetrisGame.dropTime = 0
  }

  tetrisGame.lastTime = time
  drawBoard()
  requestAnimationFrame(gameLoop)
}

function dropPiece() {
  if (canMove(tetrisGame.currentPiece, 0, 1)) {
    tetrisGame.currentPiece.y++
  } else {
    placePiece()
    clearLines()
    tetrisGame.currentPiece = tetrisGame.nextPiece
    tetrisGame.nextPiece = createPiece()

    // Check game over
    if (!canMove(tetrisGame.currentPiece, 0, 0)) {
      gameOver()
    }
  }
}

function canMove(piece, dx, dy, rotation = null) {
  const shape = rotation !== null ? rotatePiece(piece.shape, rotation) : piece.shape
  const newX = piece.x + dx
  const newY = piece.y + dy

  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] !== 0) {
        const boardX = newX + x
        const boardY = newY + y

        if (boardX < 0 || boardX >= 10 || boardY >= 20) return false
        if (boardY >= 0 && tetrisGame.board[boardY][boardX] !== 0) return false
      }
    }
  }
  return true
}

function placePiece() {
  const piece = tetrisGame.currentPiece
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x] !== 0) {
        const boardY = piece.y + y
        const boardX = piece.x + x
        if (boardY >= 0) {
          tetrisGame.board[boardY][boardX] = piece.color
        }
      }
    }
  }

  tetrisGame.placedBlocks++
  if (tetrisGame.placedBlocks >= 3) {
    gameOver()
    return
  }
}

function clearLines() {
  let linesCleared = 0

  for (let y = tetrisGame.board.length - 1; y >= 0; y--) {
    if (tetrisGame.board[y].every((cell) => cell !== 0)) {
      tetrisGame.board.splice(y, 1)
      tetrisGame.board.unshift(Array(10).fill(0))
      linesCleared++
      y++ // Check same line again
    }
  }

  if (linesCleared > 0) {
    tetrisGame.lines += linesCleared
    tetrisGame.score += linesCleared * 100 * tetrisGame.level
    tetrisGame.level = Math.floor(tetrisGame.lines / 10) + 1
    tetrisGame.dropInterval = Math.max(100, 250 - (tetrisGame.level - 1) * 30) // Faster progression
    updateGameInfo()
  }
}

function rotatePiece(shape, direction = 1) {
  const rotated = []
  const size = shape.length

  for (let i = 0; i < size; i++) {
    rotated[i] = []
    for (let j = 0; j < size; j++) {
      rotated[i][j] = direction === 1 ? shape[size - 1 - j][i] : shape[j][size - 1 - i]
    }
  }
  return rotated
}

function drawBoard() {
  const ctx = tetrisGame.ctx
  const blockSize = 30

  // Clear canvas
  ctx.fillStyle = "#000"
  ctx.fillRect(0, 0, tetrisGame.canvas.width, tetrisGame.canvas.height)

  // Draw board
  for (let y = 0; y < tetrisGame.board.length; y++) {
    for (let x = 0; x < tetrisGame.board[y].length; x++) {
      if (tetrisGame.board[y][x] !== 0) {
        ctx.fillStyle = TETRIS_COLORS[tetrisGame.board[y][x]]
        ctx.fillRect(x * blockSize, y * blockSize, blockSize - 1, blockSize - 1)
      }
    }
  }

  // Draw current piece
  if (tetrisGame.currentPiece) {
    ctx.fillStyle = TETRIS_COLORS[tetrisGame.currentPiece.color]
    const piece = tetrisGame.currentPiece
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] !== 0) {
          const drawX = (piece.x + x) * blockSize
          const drawY = (piece.y + y) * blockSize
          ctx.fillRect(drawX, drawY, blockSize - 1, blockSize - 1)
        }
      }
    }
  }
}

function updateGameInfo() {
  document.getElementById("score").textContent = tetrisGame.score
  document.getElementById("level").textContent = tetrisGame.level
  document.getElementById("lines").textContent = tetrisGame.lines
}

function gameOver() {
  stopTetris()
  showGameModal()
}

document.addEventListener("keydown", (e) => {
  if (currentPage !== "gamePage" || !tetrisGame.gameRunning || tetrisGame.gamePaused) return

  switch (e.key) {
    case "ArrowLeft":
      if (canMove(tetrisGame.currentPiece, -1, 0)) {
        tetrisGame.currentPiece.x--
      }
      break
    case "ArrowRight":
      if (canMove(tetrisGame.currentPiece, 1, 0)) {
        tetrisGame.currentPiece.x++
      }
      break
    case "ArrowDown":
      if (canMove(tetrisGame.currentPiece, 0, 1)) {
        tetrisGame.currentPiece.y++
        tetrisGame.score += 1
        updateGameInfo()
      }
      break
    case "ArrowUp":
      const rotated = rotatePiece(tetrisGame.currentPiece.shape)
      if (canMove(tetrisGame.currentPiece, 0, 0, 1)) {
        tetrisGame.currentPiece.shape = rotated
      }
      break
  }
  e.preventDefault()
})

// Fungsi tampilkan modal game
function showGameModal() {
  const modal = document.getElementById("gameModal")
  const modalText = modal.querySelector("p")

  modalText.textContent = CONFIG.loseMessage

  modal.style.display = "block"

  // Tambahkan efek blur ke background
  document.body.style.overflow = "hidden"
}

// Fungsi tutup modal
function closeModal() {
  const modal = document.getElementById("gameModal")
  modal.style.display = "none"
  document.body.style.overflow = "auto"
}

// Fungsi buka hadiah
function openGift(giftIndex) {
  const giftBoxes = document.querySelectorAll(".gift-box")
  const giftMessage = document.getElementById("giftMessage")

  // Jika hadiah sudah dibuka, return
  if (giftOpened[giftIndex]) {
    return
  }

  // Tandai hadiah sebagai terbuka
  giftOpened[giftIndex] = true

  // Tambahkan animasi buka kotak
  giftBoxes[giftIndex].classList.add("opened")

  // Tampilkan pesan hadiah
  giftMessage.textContent = CONFIG.giftMessages[giftIndex]
  giftMessage.style.display = "block"

  // Disable kotak hadiah lainnya
  giftBoxes.forEach((box, index) => {
    if (index !== giftIndex) {
      box.style.opacity = "0.5"
      box.style.cursor = "not-allowed"
    }
  })

  // Tambahkan efek confetti (simulasi dengan emoji)
  createConfetti()
}

// Fungsi buat efek confetti
function createConfetti() {
  const confettiEmojis = ["🎉", "🎊", "✨", "💖", "🌟"]

  for (let i = 0; i < 20; i++) {
    setTimeout(() => {
      const confetti = document.createElement("div")
      confetti.textContent = confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)]
      confetti.style.position = "fixed"
      confetti.style.left = Math.random() * 100 + "vw"
      confetti.style.top = "-50px"
      confetti.style.fontSize = "2rem"
      confetti.style.pointerEvents = "none"
      confetti.style.zIndex = "9999"
      confetti.style.animation = "confettiFall 3s linear forwards"

      document.body.appendChild(confetti)

      // Hapus confetti setelah animasi selesai
      setTimeout(() => {
        if (confetti.parentNode) {
          confetti.parentNode.removeChild(confetti)
        }
      }, 3000)
    }, i * 100)
  }
}

// CSS untuk animasi confetti (ditambahkan via JavaScript)
const style = document.createElement("style")
style.textContent = `
    @keyframes confettiFall {
        to {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
        }
    }
`
document.head.appendChild(style)

// Event listener untuk menutup modal saat klik di luar
window.onclick = (event) => {
  const modal = document.getElementById("gameModal")
  if (event.target === modal) {
    closeModal()
  }
}

function addMobileControls() {
  // Touch controls for mobile
  let touchStartX = 0
  let touchStartY = 0
  let touchEndX = 0
  let touchEndY = 0

  const canvas = tetrisGame.canvas
  if (!canvas) return

  canvas.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      touchStartX = touch.clientX
      touchStartY = touch.clientY

      // Store touch start time for tap detection
      canvas.touchStartTime = Date.now()
    },
    { passive: false },
  )

  canvas.addEventListener(
    "touchend",
    (e) => {
      e.preventDefault()
      const touch = e.changedTouches[0]
      touchEndX = touch.clientX
      touchEndY = touch.clientY

      const touchDuration = Date.now() - (canvas.touchStartTime || 0)
      const deltaX = touchEndX - touchStartX
      const deltaY = touchEndY - touchStartY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

      // If it's a quick tap (short duration and small movement), rotate
      if (touchDuration < 200 && distance < 30) {
        rotatePieceControl()
      } else {
        handleSwipe()
      }
    },
    { passive: false },
  )

  function handleSwipe() {
    if (currentPage !== "gamePage" || !tetrisGame.gameRunning || tetrisGame.gamePaused) return

    const deltaX = touchEndX - touchStartX
    const deltaY = touchEndY - touchStartY
    const minSwipeDistance = 15 // Reduced from 20 to 15 for more responsive controls

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          // Swipe right
          if (canMove(tetrisGame.currentPiece, 1, 0)) {
            tetrisGame.currentPiece.x++
          }
        } else {
          // Swipe left
          if (canMove(tetrisGame.currentPiece, -1, 0)) {
            tetrisGame.currentPiece.x--
          }
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0) {
          // Swipe down - soft drop
          if (canMove(tetrisGame.currentPiece, 0, 1)) {
            tetrisGame.currentPiece.y++
            tetrisGame.score += 1
            updateGameInfo()
          }
        } else {
          // Swipe up now does hard drop instead of rotate
          // Hard drop - drop piece to bottom
          while (canMove(tetrisGame.currentPiece, 0, 1)) {
            tetrisGame.currentPiece.y++
            tetrisGame.score += 2
          }
          updateGameInfo()
        }
      }
    }
  }
}

// Fungsi tambahan untuk animasi saat scroll (surprise page)
function handleScrollAnimations() {
  const photoItems = document.querySelectorAll(".photo-item")

  photoItems.forEach((item, index) => {
    const rect = item.getBoundingClientRect()
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0

    if (isVisible && !item.classList.contains("animated")) {
      setTimeout(() => {
        item.style.opacity = "1"
        item.style.transform = "translateY(0)"
        item.classList.add("animated")
      }, index * 300)
    }
  })
}

// Event listener untuk scroll
window.addEventListener("scroll", handleScrollAnimations)

// Fungsi buat floating hearts
function createFloatingHearts() {
  const hearts = ["💖", "💕", "💗", "💝"]

  setInterval(() => {
    if (Math.random() < 0.3) {
      // 30% chance setiap interval
      const heart = document.createElement("div")
      heart.textContent = hearts[Math.floor(Math.random() * hearts.length)]
      heart.style.position = "fixed"
      heart.style.left = Math.random() * 100 + "vw"
      heart.style.bottom = "-50px"
      heart.style.fontSize = "1.5rem"
      heart.style.pointerEvents = "none"
      heart.style.zIndex = "-1"
      heart.style.opacity = "0.6"
      heart.style.animation = "heartFloat 8s linear forwards"

      document.body.appendChild(heart)

      setTimeout(() => {
        if (heart.parentNode) {
          heart.parentNode.removeChild(heart)
        }
      }, 8000)
    }
  }, 2000)
}

function createFloatingParticles() {
  const particles = ["✨", "💖", "🌟", "💕", "🎀", "🌸", "💫", "🦋"]

  setInterval(() => {
    if (Math.random() < 0.4) {
      const particle = document.createElement("div")
      particle.className = "particle"
      particle.textContent = particles[Math.floor(Math.random() * particles.length)]
      particle.style.left = Math.random() * 100 + "vw"
      particle.style.animationDuration = Math.random() * 10 + 10 + "s"
      particle.style.fontSize = Math.random() * 0.8 + 0.8 + "rem"

      document.body.appendChild(particle)

      setTimeout(() => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle)
        }
      }, 20000)
    }
  }, 1500)
}

function createSparkleEffect() {
  const sparkles = ["✨", "⭐", "💫", "🌟"]

  setInterval(() => {
    if (Math.random() < 0.2) {
      const sparkle = document.createElement("div")
      sparkle.className = "sparkle"
      sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)]
      sparkle.style.left = Math.random() * 100 + "vw"
      sparkle.style.animationDuration = Math.random() * 3 + 2 + "s"
      sparkle.style.fontSize = Math.random() * 1 + 0.8 + "rem"

      document.body.appendChild(sparkle)

      setTimeout(() => {
        if (sparkle.parentNode) {
          sparkle.parentNode.removeChild(sparkle)
        }
      }, 5000)
    }
  }, 800)
}

function rotateRomanticQuotes() {
  const quotes = [
    "Di umur yang semakin tua ini aku harap kamu,bisa menjadi pribadi yang lebih baik💕",
    "Jangan marah marah ke aku terus,kalo ke yang lain terserah😏 ✨",
    "Jangan pundungan yahh🌈",
    "Nanti Tambah imutt💖",
    "jangan suka ngilang tiba-tiba😏",
    "Nanti beneran ilang di culik hantuu🤭",
  ]

  let currentQuote = 0
  const quoteElement = document.createElement("div")
  quoteElement.className = "floating-quote"
  quoteElement.textContent = quotes[currentQuote]
  document.body.appendChild(quoteElement)

  setInterval(() => {
    currentQuote = (currentQuote + 1) % quotes.length
    quoteElement.style.opacity = "0"
    setTimeout(() => {
      quoteElement.textContent = quotes[currentQuote]
      quoteElement.style.opacity = "1"
    }, 500)
  }, 8000)
}

// Event listener untuk Enter key di input game
document.addEventListener("DOMContentLoaded", () => {
  // Update nama di halaman utama
  const nameElement = document.querySelector(".name")
  if (nameElement && CONFIG.targetName) {
    nameElement.textContent = CONFIG.targetName
  }

  initializeMusic()

  // Tambahkan floating hearts
  createFloatingHearts()

  createFloatingParticles()

  createSparkleEffect()
  rotateRomanticQuotes()

  const particlesContainer = document.createElement("div")
  particlesContainer.className = "floating-particles"
  document.body.appendChild(particlesContainer)
})

function initializeMusic() {
  backgroundMusic = document.getElementById("backgroundMusic")

  if (backgroundMusic) {
    backgroundMusic.volume = 0.3 // Set volume to 30%
    backgroundMusic.loop = true

    // Try to play music automatically
    const playPromise = backgroundMusic.play()

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          isMusicPlaying = true
          console.log("Background music started automatically")
        })
        .catch(() => {
          // Autoplay was prevented by browser
          isMusicPlaying = false

          // Try to play on first user interaction
          const playOnInteraction = () => {
            backgroundMusic
              .play()
              .then(() => {
                isMusicPlaying = true
                console.log("Background music started on user interaction")
              })
              .catch(console.error)

            // Remove listeners after first successful play
            document.removeEventListener("click", playOnInteraction)
            document.removeEventListener("touchstart", playOnInteraction)
          }

          document.addEventListener("click", playOnInteraction)
          document.addEventListener("touchstart", playOnInteraction)
        })
    }
  }
}

// Tambahkan CSS untuk animasi heart float
const heartStyle = document.createElement("style")
heartStyle.textContent = `
    @keyframes heartFloat {
        to {
            transform: translateY(-100vh) rotate(360deg);
            opacity: 0;
        }
    }
`
document.head.appendChild(heartStyle)

function rotatePieceControl() {
  if (currentPage !== "gamePage" || !tetrisGame.gameRunning || tetrisGame.gamePaused) return
  const rotated = rotatePiece(tetrisGame.currentPiece.shape)
  if (canMove(tetrisGame.currentPiece, 0, 0, 1)) {
    tetrisGame.currentPiece.shape = rotated
  }
}
