import React, { useEffect, useRef } from 'react';

const HuntingScene: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Animation variables
        let cloudOffset = 0;
        let birdX = 0;
        let birdFlap = 0;
        let waterShimmer = 0;
        let grassSway = 0;
        let fireFlicker = 0;
        let dragProgress = 0;
        let characterBreath = 0;

        // ----- Drawing functions (reused from original) -----
        const drawSky = () => {
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(1, '#B0E0E6');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        const drawSun = () => {
            ctx.fillStyle = '#FDB813';
            ctx.beginPath();
            ctx.arc(750, 70, 35, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(253, 184, 19, 0.3)';
            ctx.beginPath();
            ctx.arc(750, 70, 50, 0, Math.PI * 2);
            ctx.fill();
        };

        const drawCloud = (x: number, y: number, width: number, height: number) => {
            ctx.beginPath();
            ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + width / 3, y - 5, width / 3, height / 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x - width / 3, y, width / 3, height / 2.5, 0, 0, Math.PI * 2);
            ctx.fill();
        };

        const drawClouds = () => {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            const cloud1X = (cloudOffset % 1000) - 100;
            drawCloud(cloud1X, 60, 100, 35);
            const cloud2X = ((cloudOffset + 500) % 1000) - 100;
            drawCloud(cloud2X, 100, 120, 40);
        };

        const drawBird = () => {
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 2;
            const y = 110 + Math.sin(birdFlap) * 3;
            ctx.beginPath();
            ctx.moveTo(birdX, y);
            ctx.quadraticCurveTo(birdX + 8, y - 8 + Math.sin(birdFlap) * 4, birdX + 16, y);
            ctx.stroke();
        };

        const drawMountains = () => {
            ctx.fillStyle = '#A8A8A8';
            ctx.beginPath();
            ctx.moveTo(0, 280);
            ctx.lineTo(100, 200);
            ctx.lineTo(200, 230);
            ctx.lineTo(350, 180);
            ctx.lineTo(500, 210);
            ctx.lineTo(650, 190);
            ctx.lineTo(800, 220);
            ctx.lineTo(900, 210);
            ctx.lineTo(900, 280);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#BEBEBE';
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(0, 280);
            ctx.lineTo(150, 220);
            ctx.lineTo(300, 245);
            ctx.lineTo(450, 205);
            ctx.lineTo(600, 235);
            ctx.lineTo(750, 225);
            ctx.lineTo(900, 240);
            ctx.lineTo(900, 280);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
        };

        const drawGround = () => {
            const gradient = ctx.createLinearGradient(0, 280, 0, 380);
            gradient.addColorStop(0, '#7CB342');
            gradient.addColorStop(1, '#689F38');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 280, canvas.width, 100);
        };

        const drawGrass = () => {
            ctx.strokeStyle = '#558B2F';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            for (let i = 0; i < 20; i++) {
                const x = i * 45 + 20;
                const sway = Math.sin(grassSway + i * 0.5) * 2;
                ctx.beginPath();
                ctx.moveTo(x, 280);
                ctx.lineTo(x + sway, 268);
                ctx.stroke();
            }
        };

        const drawTree = (x: number, y: number, trunkHeight: number, foliageSize: number, foliageColor: string) => {
            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(x - 6, y - trunkHeight, 12, trunkHeight);
            ctx.fillStyle = foliageColor;
            ctx.beginPath();
            ctx.arc(x, y - trunkHeight - 10, foliageSize, 0, Math.PI * 2);
            ctx.fill();
        };

        // VEADO MORTO - deitado no chão
        const drawDeadDeer = (x: number, y: number) => {
            ctx.save();

            // Sombra embaixo do veado
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.beginPath();
            ctx.ellipse(x + 10, y + 2, 35, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            // Corpo deitado de lado com gradiente
            const bodyGradient = ctx.createLinearGradient(x - 25, y - 15, x + 35, y - 5);
            bodyGradient.addColorStop(0, '#8B6F47');
            bodyGradient.addColorStop(0.5, '#A0826D');
            bodyGradient.addColorStop(1, '#7A5C3E');
            ctx.fillStyle = bodyGradient;
            ctx.beginPath();
            ctx.ellipse(x + 5, y - 8, 28, 12, 0, 0, Math.PI * 2);
            ctx.fill();

            // Detalhes da pelagem (listras sutis)
            ctx.strokeStyle = 'rgba(90, 60, 40, 0.2)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.moveTo(x - 15 + i * 8, y - 15);
                ctx.lineTo(x - 10 + i * 8, y - 2);
                ctx.stroke();
            }

            // Pernas dobradas (morto)
            ctx.fillStyle = '#7A5C3E';
            // Pernas traseiras
            ctx.fillRect(x - 18, y - 5, 4, 8);
            ctx.fillRect(x - 10, y - 3, 4, 6);
            // Pernas dianteiras
            ctx.fillRect(x + 15, y - 6, 4, 9);
            ctx.fillRect(x + 22, y - 4, 4, 7);

            // Cascos
            ctx.fillStyle = '#2C1810';
            ctx.fillRect(x - 18, y + 3, 4, 2);
            ctx.fillRect(x - 10, y + 3, 4, 2);
            ctx.fillRect(x + 15, y + 3, 4, 2);
            ctx.fillRect(x + 22, y + 3, 4, 2);

            // Pescoço esticado
            ctx.fillStyle = '#8B6F47';
            ctx.beginPath();
            ctx.ellipse(x + 30, y - 6, 8, 4, 0.1, 0, Math.PI * 2);
            ctx.fill();

            // Cabeça deitada no chão
            const headGradient = ctx.createRadialGradient(x + 36, y - 4, 2, x + 36, y - 4, 7);
            headGradient.addColorStop(0, '#9B8169');
            headGradient.addColorStop(1, '#7A5C3E');
            ctx.fillStyle = headGradient;
            ctx.beginPath();
            ctx.ellipse(x + 36, y - 4, 6, 7, 0.2, 0, Math.PI * 2);
            ctx.fill();

            // Focinho
            ctx.fillStyle = '#A0826D';
            ctx.beginPath();
            ctx.ellipse(x + 42, y - 2, 4, 3, 0.1, 0, Math.PI * 2);
            ctx.fill();

            // Nariz
            ctx.fillStyle = '#2C1810';
            ctx.beginPath();
            ctx.ellipse(x + 45, y - 2, 1.5, 1, 0, 0, Math.PI * 2);
            ctx.fill();

            // Olho fechado (morto)
            ctx.strokeStyle = '#4A3628';
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x + 35, y - 6);
            ctx.lineTo(x + 38, y - 6);
            ctx.stroke();

            // Língua ligeiramente para fora
            ctx.fillStyle = '#D8757A';
            ctx.beginPath();
            ctx.ellipse(x + 44, y, 2, 1, 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Orelhas caídas
            ctx.fillStyle = '#7A5C3E';
            ctx.beginPath();
            ctx.ellipse(x + 32, y - 10, 2, 4, -0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#9B8169';
            ctx.beginPath();
            ctx.ellipse(x + 32, y - 10, 1, 2.5, -0.8, 0, Math.PI * 2);
            ctx.fill();

            // Chifres ramificados no chão
            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Chifre principal
            ctx.beginPath();
            ctx.moveTo(x + 33, y - 11);
            ctx.lineTo(x + 30, y - 18);
            ctx.stroke();
            // Ramificações
            ctx.beginPath();
            ctx.moveTo(x + 30, y - 16);
            ctx.lineTo(x + 28, y - 15);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 30, y - 18);
            ctx.lineTo(x + 32, y - 17);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(x + 37, y - 11);
            ctx.lineTo(x + 40, y - 18);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 40, y - 16);
            ctx.lineTo(x + 42, y - 15);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 40, y - 18);
            ctx.lineTo(x + 38, y - 17);
            ctx.stroke();

            // Cauda caída
            ctx.strokeStyle = '#6D4C41';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - 20, y - 10);
            ctx.quadraticCurveTo(x - 24, y - 6, x - 26, y - 2);
            ctx.stroke();

            // Marca de ferimento (lança)
            ctx.fillStyle = '#8B0000';
            ctx.beginPath();
            ctx.ellipse(x + 2, y - 12, 3, 2, 0.4, 0, Math.PI * 2);
            ctx.fill();

            // Sangue escorrido
            ctx.strokeStyle = '#8B0000';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x + 2, y - 10);
            ctx.lineTo(x + 1, y - 5);
            ctx.stroke();

            ctx.restore();
        };

        // Lança cravada no chão próxima ao veado
        const drawSpearOnGround = (x: number, y: number) => {
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-0.3);

            // Haste da lança
            ctx.strokeStyle = '#8D6E63';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(50, -15);
            ctx.stroke();

            // Ponta de pedra com sangue
            ctx.fillStyle = '#8B0000';
            ctx.beginPath();
            ctx.moveTo(50, -15);
            ctx.lineTo(45, -10);
            ctx.lineTo(55, -10);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#555555';
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(50, -20);
            ctx.lineTo(45, -12);
            ctx.lineTo(55, -12);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;

            ctx.restore();
        };

        // Caçador orgulhoso/cansado ao lado da presa
        const drawVictoriousCharacter = (x: number, y: number) => {
            const breathMove = Math.sin(characterBreath) * 0.8;

            // Lança na mão (vertical, apoiado)
            ctx.strokeStyle = '#8D6E63';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x - 20, y - 70 + breathMove);
            ctx.lineTo(x - 20, y - 15);
            ctx.stroke();

            ctx.fillStyle = '#666666';
            ctx.beginPath();
            ctx.moveTo(x - 20, y - 77 + breathMove);
            ctx.lineTo(x - 25, y - 69 + breathMove);
            ctx.lineTo(x - 15, y - 69 + breathMove);
            ctx.closePath();
            ctx.fill();

            // Cabeça
            const headGradient = ctx.createRadialGradient(x - 3, y - 57 + breathMove, 3, x, y - 55 + breathMove, 13);
            headGradient.addColorStop(0, '#C89968');
            headGradient.addColorStop(0.7, '#B8895A');
            headGradient.addColorStop(1, '#9A7148');
            ctx.fillStyle = headGradient;
            ctx.beginPath();
            ctx.ellipse(x, y - 55 + breathMove, 11, 13, 0, 0, Math.PI * 2);
            ctx.fill();

            // Olhos (expressão de orgulho/cansaço)
            ctx.fillStyle = '#F5E6D3';
            ctx.beginPath();
            ctx.ellipse(x - 4, y - 57 + breathMove, 2.5, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 4, y - 57 + breathMove, 2.5, 2, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#3E2723';
            ctx.beginPath();
            ctx.arc(x - 3.5, y - 57 + breathMove, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 4.5, y - 57 + breathMove, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Sobrancelhas (expressão determinada)
            ctx.strokeStyle = '#4A3628';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - 7, y - 60 + breathMove);
            ctx.lineTo(x - 2, y - 61 + breathMove);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 2, y - 61 + breathMove);
            ctx.lineTo(x + 7, y - 60 + breathMove);
            ctx.stroke();

            // Nariz
            ctx.strokeStyle = '#8D6E63';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x - 1, y - 55 + breathMove);
            ctx.lineTo(x - 2, y - 51 + breathMove);
            ctx.moveTo(x + 1, y - 55 + breathMove);
            ctx.lineTo(x + 2, y - 51 + breathMove);
            ctx.stroke();

            // Boca (sorriso de vitória)
            ctx.strokeStyle = '#6D4C41';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x - 3, y - 48 + breathMove);
            ctx.quadraticCurveTo(x, y - 46 + breathMove, x + 3, y - 48 + breathMove);
            ctx.stroke();

            // Barba
            ctx.fillStyle = '#3E2723';
            ctx.beginPath();
            ctx.moveTo(x - 9, y - 47 + breathMove);
            ctx.lineTo(x - 7, y - 44 + breathMove);
            ctx.lineTo(x + 7, y - 44 + breathMove);
            ctx.lineTo(x + 9, y - 47 + breathMove);
            ctx.quadraticCurveTo(x, y - 43 + breathMove, x - 9, y - 47 + breathMove);
            ctx.fill();

            // Capacete
            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(x - 11, y - 68 + breathMove, 22, 7);

            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(x - 9 + i * 6, y - 68 + breathMove);
                ctx.lineTo(x - 9 + i * 6, y - 61 + breathMove);
                ctx.stroke();
            }

            // Corpo
            ctx.fillStyle = '#A0826D';
            ctx.fillRect(x - 14, y - 42 + breathMove, 28, 35);

            // Manchas de sangue na roupa
            ctx.fillStyle = 'rgba(139, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.arc(x - 5, y - 30 + breathMove, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 3, y - 25 + breathMove, 2, 0, Math.PI * 2);
            ctx.fill();

            // Colar de ossos
            ctx.strokeStyle = '#D7CCC8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y - 41 + breathMove, 8, 0.3, Math.PI - 0.3);
            ctx.stroke();

            // Braço livre (apontando para o veado com orgulho)
            ctx.fillStyle = '#C89968';
            ctx.save();
            ctx.translate(x + 14, y - 35 + breathMove);
            ctx.rotate(0.5);
            ctx.fillRect(0, -3, 18, 6);
            ctx.restore();

            ctx.fillStyle = '#B8895A';
            ctx.beginPath();
            ctx.arc(x + 28, y - 28 + breathMove, 4, 0, Math.PI * 2);
            ctx.fill();

            // Pernas
            ctx.fillStyle = '#A0826D';
            ctx.fillRect(x - 12, y - 7, 10, 22);
            ctx.fillRect(x + 2, y - 7, 10, 22);

            // Pés
            ctx.fillStyle = '#9A7148';
            ctx.beginPath();
            ctx.ellipse(x - 7, y + 16, 6, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 7, y + 16, 6, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        };

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawSky();
            drawSun();
            drawClouds();
            drawBird();
            drawMountains();
            drawGround();
            drawGrass();
            drawTree(110, 280, 45, 30, '#4CAF50');
            drawTree(820, 280, 42, 28, '#66BB6A');

            // Rastro de sangue do veado
            ctx.strokeStyle = 'rgba(139, 0, 0, 0.3)';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(400, 276);
            ctx.quadraticCurveTo(500, 278, 600, 277);
            ctx.stroke();
            ctx.setLineDash([]);

            // Cena principal: veado morto sendo exibido
            drawDeadDeer(600, 280);
            drawSpearOnGround(680, 280);
            drawVictoriousCharacter(520, 280);
        };

        const animate = () => {
            cloudOffset += 0.3;
            birdX += 0.6;
            if (birdX > canvas.width + 20) birdX = -20;
            birdFlap += 0.1;
            waterShimmer += 0.6;
            grassSway += 0.02;
            fireFlicker += 0.06;
            characterBreath += 0.04;
            render();
            requestAnimationFrame(animate);
        };

        animate();
    }, []);

    return (
        <canvas
            ref={canvasRef}
            width={900}
            height={380}
            style={{
                maxWidth: '100%',
                borderRadius: '12px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
            }}
        />
    );
};

export default HuntingScene;
