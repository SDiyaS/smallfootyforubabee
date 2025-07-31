class FootballGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.messages = [
            "you rejected my idea of audio call with multiple cold Nos, wasn't even okay with listening to my voice at the first place, Schooled me too till 2am but still wasn't okay with me being on call !",
            "i will ruin my sleep schedule for you on saturday night ~ Manan, what happened to that baby? forgot ?",
            "if yes, you forgot, i want to know why do i not matter enough to you to make a call,that I wanted so deperately, and that you turned down so deperately",
            "its not okay to be so heartless,and since ur brainisnt braining for workload, i didt want this message to be one of those from my long texts, that you half read, half overlook",
            "Ahhhhhhhhhhhhhhhhhhh I will bite ur ears offf, no nibbling, I WILL BITE"
        ];
        
        this.init();
        this.setupEventListeners();
        this.gameLoop();
    }

    init() {
        this.goalsScored = 0;
        this.currentBall = 1;
        this.isGameActive = true;
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.dragEnd = { x: 0, y: 0 };
        
        // Ball properties
        this.ball = {
            x: 400, // Center of canvas
            y: 400, // Bottom area
            radius: 15,
            vx: 0,
            vy: 0,
            isMoving: false,
            trail: []
        };
        
        // Goal properties
        this.goal = {
            x: 325,
            y: 50,
            width: 200,
            height: 100
        };
        
        // Goalkeeper
        this.goalkeeper = {
            x: 400,
            y: 90,
            width: 30,
            height: 40,
            moveDirection: 1,
            speed: 0.1
        };
        
        this.updateDisplay();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Modal buttons
        document.getElementById('next-ball-btn').addEventListener('click', () => this.nextBall());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        document.getElementById('play-again-btn').addEventListener('click', () => this.restartGame());
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    getTouchPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.touches[0].clientX - rect.left) * scaleX,
            y: (e.touches[0].clientY - rect.top) * scaleY
        };
    }

    handleMouseDown(e) {
        if (!this.isGameActive || this.ball.isMoving) return;
        
        const pos = this.getMousePos(e);
        const distance = Math.sqrt((pos.x - this.ball.x) ** 2 + (pos.y - this.ball.y) ** 2);
        
        if (distance <= this.ball.radius + 10) {
            this.isDragging = true;
            this.dragStart = pos;
        }
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;
        this.dragEnd = this.getMousePos(e);
    }

    handleMouseUp(e) {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.shootBall();
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (!this.isGameActive || this.ball.isMoving) return;
        
        const pos = this.getTouchPos(e);
        const distance = Math.sqrt((pos.x - this.ball.x) ** 2 + (pos.y - this.ball.y) ** 2);
        
        if (distance <= this.ball.radius + 10) {
            this.isDragging = true;
            this.dragStart = pos;
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.isDragging) return;
        this.dragEnd = this.getTouchPos(e);
    }

    handleTouchEnd(e) {
        e.preventDefault();
        if (!this.isDragging) return;
        this.isDragging = false;
        this.shootBall();
    }

    shootBall() {
        const power = Math.min(Math.sqrt((this.dragEnd.x - this.dragStart.x) ** 2 + (this.dragEnd.y - this.dragStart.y) ** 2) / 6, 25);
        const angle = Math.atan2(this.dragStart.y - this.dragEnd.y, this.dragEnd.x - this.dragStart.x);
        
        this.ball.vx = Math.cos(angle) * power;
        this.ball.vy = Math.sin(angle) * power;
        this.ball.isMoving = true;
        this.ball.trail = [];
    }

    updateBall() {
        if (!this.ball.isMoving) return;

        // Add to trail
        this.ball.trail.push({ x: this.ball.x, y: this.ball.y });
        if (this.ball.trail.length > 10) {
            this.ball.trail.shift();
        }

        // Update position
        this.ball.x += this.ball.vx;
        this.ball.y += this.ball.vy;

        // Apply friction and gravity
        this.ball.vx *= 0.995;
        this.ball.vy *= 0.995;
        this.ball.vy += 0.08; // Much reduced gravity

        // Bounce off walls
        if (this.ball.x <= this.ball.radius || this.ball.x >= this.canvas.width - this.ball.radius) {
            this.ball.vx *= -0.8;
            this.ball.x = Math.max(this.ball.radius, Math.min(this.canvas.width - this.ball.radius, this.ball.x));
        }

        // Check for goal
        if (this.ball.y <= this.goal.y + this.goal.height &&
            this.ball.x >= this.goal.x &&
            this.ball.x <= this.goal.x + this.goal.width) {
            this.handleGoal();
            return;
        }

        // Check if ball went out of bounds or stopped moving
        if (this.ball.y > this.canvas.height + 100 || 
            (Math.abs(this.ball.vx) < 0.02 && Math.abs(this.ball.vy) < 0.02 && this.ball.y > 380)) {
            this.handleMiss();
        }
    }

    updateGoalkeeper() {
        this.goalkeeper.x += this.goalkeeper.moveDirection * this.goalkeeper.speed;
        
        if (this.goalkeeper.x <= this.goal.x + 20 || this.goalkeeper.x >= this.goal.x + this.goal.width - 50) {
            this.goalkeeper.moveDirection *= -1;
        }
    }

    handleGoal() {
        this.ball.isMoving = false;
        this.goalsScored++;
        
        // Celebration effect
        this.canvas.classList.add('goal-celebration');
        setTimeout(() => this.canvas.classList.remove('goal-celebration'), 500);
        
        if (this.goalsScored < 5) {
            this.showMessage(this.messages[this.goalsScored - 1]);
        } else {
            this.showVictory();
        }
        
        this.updateDisplay();
    }

    handleMiss() {
        this.ball.isMoving = false;
        this.showGameOver();
    }

    showMessage(message) {
        document.getElementById('love-message').textContent = message;
        document.getElementById('message-modal').classList.remove('hidden');
    }

    showGameOver() {
        document.getElementById('game-over-modal').classList.remove('hidden');
    }

    showVictory() {
        document.getElementById('victory-modal').classList.remove('hidden');
    }

    nextBall() {
        document.getElementById('message-modal').classList.add('hidden');
        
        if (this.goalsScored >= 5) {
            this.showVictory();
            return;
        }
        
        this.currentBall++;
        this.resetBall();
        this.updateDisplay();
    }

    restartGame() {
        document.getElementById('game-over-modal').classList.add('hidden');
        document.getElementById('victory-modal').classList.add('hidden');
        this.init();
    }

    resetBall() {
        this.ball.x = 400;
        this.ball.y = 400;
        this.ball.vx = 0;
        this.ball.vy = 0;
        this.ball.isMoving = false;
        this.ball.trail = [];
    }

    updateDisplay() {
        document.getElementById('goals-scored').textContent = this.goalsScored;
        document.getElementById('current-ball').textContent = this.currentBall;
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw field
        this.drawField();
        
        // Draw goal
        this.drawGoal();
        
        // Draw goalkeeper
        this.drawGoalkeeper();
        
        // Draw ball trail
        this.drawTrail();
        
        // Draw ball
        this.drawBall();
        
        // Draw aiming line
        if (this.isDragging) {
            this.drawAimingLine();
        }
    }

    drawField() {
        // Sky
        const gradient = this.ctx.createLinearGradient(0, 0, 0, 100);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98D8E8');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, 100);
        
        // Grass
        const grassGradient = this.ctx.createLinearGradient(0, 100, 0, this.canvas.height);
        grassGradient.addColorStop(0, '#32CD32');
        grassGradient.addColorStop(1, '#228B22');
        this.ctx.fillStyle = grassGradient;
        this.ctx.fillRect(0, 100, this.canvas.width, this.canvas.height - 100);
        
        // Field lines
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 3;
        
        // Center circle
        this.ctx.beginPath();
        this.ctx.arc(400, 300, 50, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Penalty area
        this.ctx.strokeRect(275, 100, 250, 120);
        
        // Goal area
        this.ctx.strokeRect(325, 100, 150, 80);
    }

    drawGoal() {
        // Goal posts
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(this.goal.x - 5, this.goal.y, 10, this.goal.height);
        this.ctx.fillRect(this.goal.x + this.goal.width - 5, this.goal.y, 10, this.goal.height);
        this.ctx.fillRect(this.goal.x, this.goal.y - 5, this.goal.width, 10);
        
        // Goal net
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.goal.width; i += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.goal.x + i, this.goal.y);
            this.ctx.lineTo(this.goal.x + i, this.goal.y + this.goal.height);
            this.ctx.stroke();
        }
        for (let i = 0; i < this.goal.height; i += 20) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.goal.x, this.goal.y + i);
            this.ctx.lineTo(this.goal.x + this.goal.width, this.goal.y + i);
            this.ctx.stroke();
        }
    }

    drawGoalkeeper() {
        // Body
        this.ctx.fillStyle = '#FF6B35';
        this.ctx.fillRect(this.goalkeeper.x, this.goalkeeper.y, this.goalkeeper.width, this.goalkeeper.height);
        
        // Head
        this.ctx.fillStyle = '#FDBCB4';
        this.ctx.beginPath();
        this.ctx.arc(this.goalkeeper.x + 15, this.goalkeeper.y - 10, 12, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Arms
        this.ctx.fillStyle = '#FF6B35';
        this.ctx.fillRect(this.goalkeeper.x - 8, this.goalkeeper.y + 10, 8, 20);
        this.ctx.fillRect(this.goalkeeper.x + 30, this.goalkeeper.y + 10, 8, 20);
    }

    drawBall() {
        // Ball shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.beginPath();
        this.ctx.ellipse(this.ball.x, this.ball.y + 20, this.ball.radius * 0.8, this.ball.radius * 0.3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Ball
        const ballGradient = this.ctx.createRadialGradient(this.ball.x - 5, this.ball.y - 5, 0, this.ball.x, this.ball.y, this.ball.radius);
        ballGradient.addColorStop(0, 'white');
        ballGradient.addColorStop(1, '#E0E0E0');
        this.ctx.fillStyle = ballGradient;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Ball pattern
        this.ctx.strokeStyle = 'black';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius * 0.7, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Pentagon pattern
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const x = this.ball.x + Math.cos(angle) * this.ball.radius * 0.4;
            const y = this.ball.y + Math.sin(angle) * this.ball.radius * 0.4;
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.ball.x, this.ball.y);
            this.ctx.lineTo(x, y);
            this.ctx.stroke();
        }
    }

    drawTrail() {
        if (this.ball.trail.length < 2) return;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.ball.trail[0].x, this.ball.trail[0].y);
        
        for (let i = 1; i < this.ball.trail.length; i++) {
            this.ctx.lineTo(this.ball.trail[i].x, this.ball.trail[i].y);
        }
        
        this.ctx.stroke();
    }

    drawAimingLine() {
        const distance = Math.sqrt((this.dragEnd.x - this.dragStart.x) ** 2 + (this.dragEnd.y - this.dragStart.y) ** 2);
        const maxDistance = 120;
        const power = Math.min(distance / maxDistance, 1);
        
        // Draw trajectory prediction
        this.drawTrajectoryPrediction();
        
        // Power indicator
        this.ctx.strokeStyle = `hsl(${120 * (1 - power)}, 100%, 50%)`;
        this.ctx.lineWidth = 5;
        this.ctx.beginPath();
        this.ctx.moveTo(this.ball.x, this.ball.y);
        
        const angle = Math.atan2(this.dragStart.y - this.dragEnd.y, this.dragEnd.x - this.dragStart.x);
        const lineLength = distance * 0.5;
        const endX = this.ball.x + Math.cos(angle) * lineLength;
        const endY = this.ball.y + Math.sin(angle) * lineLength;
        
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
        
        // Arrow head
        const arrowSize = 10;
        this.ctx.beginPath();
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(endX - arrowSize * Math.cos(angle - Math.PI / 6), endY - arrowSize * Math.sin(angle - Math.PI / 6));
        this.ctx.moveTo(endX, endY);
        this.ctx.lineTo(endX - arrowSize * Math.cos(angle + Math.PI / 6), endY - arrowSize * Math.sin(angle + Math.PI / 6));
        this.ctx.stroke();
    }

    drawTrajectoryPrediction() {
        if (!this.isDragging) return;
        
        const power = Math.min(Math.sqrt((this.dragEnd.x - this.dragStart.x) ** 2 + (this.dragEnd.y - this.dragStart.y) ** 2) / 6, 25);
        const angle = Math.atan2(this.dragStart.y - this.dragEnd.y, this.dragEnd.x - this.dragStart.x);
        
        let vx = Math.cos(angle) * power;
        let vy = Math.sin(angle) * power;
        let x = this.ball.x;
        let y = this.ball.y;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.6)';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        
        // Simulate trajectory for prediction
        for (let i = 0; i < 100; i++) {
            x += vx;
            y += vy;
            vx *= 0.995;
            vy *= 0.995;
            vy += 0.08;
            
            // Stop if ball goes too far or hits goal area
            if (y <= this.goal.y + this.goal.height && x >= this.goal.x && x <= this.goal.x + this.goal.width) {
                this.ctx.lineTo(x, y);
                break;
            }
            
            if (x <= 0 || x >= this.canvas.width || y > this.canvas.height) {
                break;
            }
            
            if (i % 3 === 0) { // Draw every 3rd point for smoother line
                this.ctx.lineTo(x, y);
            }
        }
        
        this.ctx.stroke();
        this.ctx.setLineDash([]); // Reset line dash
    }

    gameLoop() {
        this.updateBall();
        this.updateGoalkeeper();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new FootballGame();
});