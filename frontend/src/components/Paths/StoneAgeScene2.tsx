import React, { useEffect, useRef } from 'react';

const StoneAgeScene: React.FC = () => {
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
        let deerX = 650;
        let deerLegMove = 0;

        // ----- Drawing functions -----
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

        const drawRiver = () => {
            const gradient = ctx.createLinearGradient(0, 330, 0, 380);
            gradient.addColorStop(0, '#4A90E2');
            gradient.addColorStop(1, '#357ABD');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 330, canvas.width, 50);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            const shimmer1X = (waterShimmer * 2) % canvas.width;
            ctx.beginPath();
            ctx.ellipse(shimmer1X, 345, 25, 4, 0, 0, Math.PI * 2);
            ctx.fill();
            const shimmer2X = (waterShimmer * 3 + 300) % canvas.width;
            ctx.beginPath();
            ctx.ellipse(shimmer2X, 360, 20, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        };

        const drawTree = (x: number, y: number, trunkHeight: number, foliageSize: number, foliageColor: string) => {
            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(x - 6, y - trunkHeight, 12, trunkHeight);
            ctx.fillStyle = foliageColor;
            ctx.beginPath();
            ctx.arc(x, y - trunkHeight - 10, foliageSize, 0, Math.PI * 2);
            ctx.fill();
        };

        const drawTent = (x: number, y: number) => {
            ctx.fillStyle = '#FF6F00';
            ctx.strokeStyle = '#E65100';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - 25, y);
            ctx.lineTo(x, y - 45);
            ctx.lineTo(x + 25, y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#F57C00';
            ctx.beginPath();
            ctx.moveTo(x - 12, y);
            ctx.lineTo(x, y - 25);
            ctx.lineTo(x + 12, y);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#E65100';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x, y - 45);
            ctx.lineTo(x, y);
            ctx.stroke();
        };

        // Veado realista
        const drawDeer = (x: number, y: number) => {
            const headBob = Math.sin(deerLegMove * 0.5) * 1.2;

            // Corpo com gradiente natural
            const bodyGradient = ctx.createLinearGradient(x - 20, y - 35, x + 20, y - 15);
            bodyGradient.addColorStop(0, '#8B6F47');
            bodyGradient.addColorStop(0.5, '#A0826D');
            bodyGradient.addColorStop(1, '#7A5C3E');
            ctx.fillStyle = bodyGradient;
            ctx.beginPath();
            ctx.ellipse(x, y - 25, 20, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // Pescoço
            ctx.fillStyle = '#8B6F47';
            ctx.fillRect(x + 14, y - 43 + headBob, 8, 13);

            // Cabeça mais realista
            const headGradient = ctx.createRadialGradient(x + 18, y - 48 + headBob, 2, x + 18, y - 48 + headBob, 9);
            headGradient.addColorStop(0, '#9B8169');
            headGradient.addColorStop(1, '#7A5C3E');
            ctx.fillStyle = headGradient;
            ctx.beginPath();
            ctx.ellipse(x + 18, y - 48 + headBob, 7, 9, 0, 0, Math.PI * 2);
            ctx.fill();

            // Focinho alongado
            ctx.fillStyle = '#A0826D';
            ctx.beginPath();
            ctx.ellipse(x + 24, y - 46 + headBob, 5, 3.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Nariz detalhado
            ctx.fillStyle = '#2C1810';
            ctx.beginPath();
            ctx.ellipse(x + 27, y - 46 + headBob, 2, 1.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Narinas
            ctx.fillStyle = '#1a0d08';
            ctx.beginPath();
            ctx.arc(x + 27, y - 47 + headBob, 0.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 27, y - 45 + headBob, 0.7, 0, Math.PI * 2);
            ctx.fill();

            // Olho mais realista
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.ellipse(x + 18, y - 51 + headBob, 2.5, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2C1810';
            ctx.beginPath();
            ctx.ellipse(x + 18, y - 51 + headBob, 1.8, 2.3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.beginPath();
            ctx.arc(x + 19, y - 52 + headBob, 0.6, 0, Math.PI * 2);
            ctx.fill();

            // Orelhas peludas
            ctx.fillStyle = '#7A5C3E';
            ctx.beginPath();
            ctx.ellipse(x + 14, y - 56 + headBob, 2.5, 5, -0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#9B8169';
            ctx.beginPath();
            ctx.ellipse(x + 14, y - 56 + headBob, 1.5, 3.5, -0.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#7A5C3E';
            ctx.beginPath();
            ctx.ellipse(x + 22, y - 56 + headBob, 2.5, 5, 0.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#9B8169';
            ctx.beginPath();
            ctx.ellipse(x + 22, y - 56 + headBob, 1.5, 3.5, 0.4, 0, Math.PI * 2);
            ctx.fill();

            // Chifres ramificados realistas
            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // Chifre esquerdo
            ctx.beginPath();
            ctx.moveTo(x + 15, y - 57 + headBob);
            ctx.lineTo(x + 12, y - 66 + headBob);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 12, y - 64 + headBob);
            ctx.lineTo(x + 10, y - 62 + headBob);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 12, y - 66 + headBob);
            ctx.lineTo(x + 14, y - 64 + headBob);
            ctx.stroke();

            // Chifre direito
            ctx.beginPath();
            ctx.moveTo(x + 21, y - 57 + headBob);
            ctx.lineTo(x + 24, y - 66 + headBob);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 24, y - 64 + headBob);
            ctx.lineTo(x + 26, y - 62 + headBob);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 24, y - 66 + headBob);
            ctx.lineTo(x + 22, y - 64 + headBob);
            ctx.stroke();

            // Pernas com movimento natural e suave
            const legPhase = Math.sin(deerLegMove);
            const leg1Offset = Math.max(-1.5, Math.min(3, legPhase * 3.5));
            const leg2Offset = Math.max(-1.5, Math.min(3, -legPhase * 3.5));
            const leg3Offset = Math.max(-1.5, Math.min(3, Math.sin(deerLegMove + Math.PI * 0.5) * 3.5));
            const leg4Offset = Math.max(-1.5, Math.min(3, -Math.sin(deerLegMove + Math.PI * 0.5) * 3.5));

            ctx.fillStyle = '#7A5C3E';
            ctx.fillRect(x - 15, y - 15 - leg1Offset, 5, 15 + leg1Offset);
            ctx.fillRect(x - 5, y - 15 - leg2Offset, 5, 15 + leg2Offset);
            ctx.fillRect(x + 5, y - 15 - leg3Offset, 5, 15 + leg3Offset);
            ctx.fillRect(x + 15, y - 15 - leg4Offset, 5, 15 + leg4Offset);

            // Cascos
            ctx.fillStyle = '#2C1810';
            ctx.fillRect(x - 15, y - 1, 5, 2);
            ctx.fillRect(x - 5, y - 1, 5, 2);
            ctx.fillRect(x + 5, y - 1, 5, 2);
            ctx.fillRect(x + 15, y - 1, 5, 2);

            // Cauda com movimento suave
            ctx.strokeStyle = '#6D4C41';
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            const tailSway = Math.sin(deerLegMove * 0.7) * 2;
            ctx.beginPath();
            ctx.moveTo(x - 20, y - 28);
            ctx.quadraticCurveTo(x - 24 + tailSway, y - 26, x - 26 + tailSway, y - 23);
            ctx.stroke();
        };

        // Coelho
        const drawRabbit = (x: number, y: number) => {
            ctx.fillStyle = '#BDBDBD';
            ctx.beginPath();
            ctx.ellipse(x, y - 10, 12, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.arc(x + 8, y - 15, 7, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#9E9E9E';
            ctx.beginPath();
            ctx.ellipse(x + 6, y - 22, 2, 8, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 10, y - 22, 2, 8, 0.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(x + 10, y - 16, 1.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FF69B4';
            ctx.beginPath();
            ctx.arc(x + 13, y - 13, 1, 0, Math.PI * 2);
            ctx.fill();
        };

        // Personagem primitivo ultra-realista
        const drawCharacter = (x: number, y: number) => {
            // Lança (atrás)
            ctx.strokeStyle = '#8D6E63';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(x + 25, y - 65);
            ctx.lineTo(x + 25, y - 20);
            ctx.stroke();

            // Ponta da lança de pedra
            ctx.fillStyle = '#666666';
            ctx.beginPath();
            ctx.moveTo(x + 25, y - 72);
            ctx.lineTo(x + 20, y - 64);
            ctx.lineTo(x + 30, y - 64);
            ctx.closePath();
            ctx.fill();

            // Textura da pedra
            ctx.strokeStyle = '#555555';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(x + 23, y - 68);
            ctx.lineTo(x + 27, y - 68);
            ctx.stroke();

            // Cabeça com forma mais primitiva e realista
            const headGradient = ctx.createRadialGradient(x - 3, y - 57, 3, x, y - 55, 13);
            headGradient.addColorStop(0, '#C89968');
            headGradient.addColorStop(0.7, '#B8895A');
            headGradient.addColorStop(1, '#9A7148');
            ctx.fillStyle = headGradient;
            ctx.beginPath();
            ctx.ellipse(x, y - 55, 11, 13, 0, 0, Math.PI * 2);
            ctx.fill();

            // Sombreamento facial realista
            ctx.fillStyle = 'rgba(90, 60, 40, 0.15)';
            ctx.beginPath();
            ctx.ellipse(x - 2, y - 52, 6, 5, 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Testa pronunciada (característica primitiva)
            ctx.fillStyle = 'rgba(140, 100, 70, 0.3)';
            ctx.beginPath();
            ctx.ellipse(x, y - 61, 10, 3, 0, 0, Math.PI);
            ctx.fill();

            // Olhos profundos e realistas
            ctx.fillStyle = 'rgba(70, 50, 40, 0.2)';
            ctx.beginPath();
            ctx.ellipse(x - 4, y - 57, 4, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 4, y - 57, 4, 3, 0, 0, Math.PI * 2);
            ctx.fill();

            // Parte branca dos olhos
            ctx.fillStyle = '#F5E6D3';
            ctx.beginPath();
            ctx.ellipse(x - 4, y - 57, 2.5, 2, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 4, y - 57, 2.5, 2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Íris marrom natural
            ctx.fillStyle = '#3E2723';
            ctx.beginPath();
            ctx.arc(x - 3.5, y - 57, 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 4.5, y - 57, 1.8, 0, Math.PI * 2);
            ctx.fill();

            // Pupilas
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(x - 3.5, y - 57, 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 4.5, y - 57, 1, 0, Math.PI * 2);
            ctx.fill();

            // Brilho nos olhos
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.arc(x - 2.8, y - 58, 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x + 5.2, y - 58, 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Sobrancelhas grossas e naturais
            ctx.strokeStyle = '#4A3628';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - 7, y - 60);
            ctx.quadraticCurveTo(x - 4, y - 61, x - 1, y - 60);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x + 1, y - 60);
            ctx.quadraticCurveTo(x + 4, y - 61, x + 7, y - 60);
            ctx.stroke();

            // Nariz mais pronunciado e largo
            ctx.fillStyle = 'rgba(90, 60, 40, 0.2)';
            ctx.beginPath();
            ctx.ellipse(x, y - 53, 3, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#8D6E63';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x - 1, y - 55);
            ctx.lineTo(x - 2, y - 51);
            ctx.moveTo(x + 1, y - 55);
            ctx.lineTo(x + 2, y - 51);
            ctx.stroke();

            // Narinas
            ctx.fillStyle = '#4A3628';
            ctx.beginPath();
            ctx.ellipse(x - 2, y - 51, 1.2, 0.8, 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 2, y - 51, 1.2, 0.8, -0.3, 0, Math.PI * 2);
            ctx.fill();

            // Boca realista com lábios
            ctx.strokeStyle = '#6D4C41';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x - 3, y - 48);
            ctx.quadraticCurveTo(x, y - 47, x + 3, y - 48);
            ctx.stroke();

            // Lábio inferior
            ctx.strokeStyle = 'rgba(140, 100, 70, 0.3)';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(x - 2, y - 47);
            ctx.quadraticCurveTo(x, y - 46.5, x + 2, y - 47);
            ctx.stroke();

            // Barba e pelos faciais primitivos
            ctx.fillStyle = '#3E2723';
            ctx.beginPath();
            ctx.moveTo(x - 9, y - 47);
            ctx.lineTo(x - 7, y - 44);
            ctx.lineTo(x + 7, y - 44);
            ctx.lineTo(x + 9, y - 47);
            ctx.quadraticCurveTo(x, y - 43, x - 9, y - 47);
            ctx.fill();

            // Textura da barba
            ctx.strokeStyle = '#2C1810';
            ctx.lineWidth = 0.8;
            for (let i = 0; i < 8; i++) {
                ctx.beginPath();
                ctx.moveTo(x - 7 + i * 2, y - 45);
                ctx.lineTo(x - 7 + i * 2, y - 43);
                ctx.stroke();
            }

            // Capacete de osso/couro primitivo
            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(x - 11, y - 68, 22, 7);

            // Detalhes do capacete
            ctx.strokeStyle = '#5D4037';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(x - 9 + i * 6, y - 68);
                ctx.lineTo(x - 9 + i * 6, y - 61);
                ctx.stroke();
            }

            // Chifres/pontas decorativas
            ctx.fillStyle = '#D7CCC8';
            ctx.beginPath();
            ctx.moveTo(x - 9, y - 68);
            ctx.lineTo(x - 11, y - 74);
            ctx.lineTo(x - 7, y - 68);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(x + 7, y - 68);
            ctx.lineTo(x + 9, y - 74);
            ctx.lineTo(x + 11, y - 68);
            ctx.fill();

            // Corpo com pele de animal
            ctx.fillStyle = '#A0826D';
            ctx.fillRect(x - 14, y - 42, 28, 35);

            // Textura de pele
            ctx.strokeStyle = '#7A5C3E';
            ctx.lineWidth = 1;
            for (let i = 0; i < 6; i++) {
                ctx.beginPath();
                ctx.moveTo(x - 12, y - 40 + i * 6);
                ctx.lineTo(x + 12, y - 38 + i * 6);
                ctx.stroke();
            }

            // Colar de ossos
            ctx.strokeStyle = '#D7CCC8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y - 41, 8, 0.3, Math.PI - 0.3);
            ctx.stroke();
            for (let i = 0; i < 4; i++) {
                const angle = 0.5 + i * 0.5;
                ctx.fillStyle = '#D7CCC8';
                ctx.beginPath();
                ctx.arc(x + Math.cos(angle) * 8, y - 41 + Math.sin(angle) * 8, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            // Braço musculoso com lança
            const armGradient = ctx.createLinearGradient(x + 14, y - 38, x + 36, y - 53);
            armGradient.addColorStop(0, '#C89968');
            armGradient.addColorStop(1, '#9A7148');
            ctx.fillStyle = armGradient;
            ctx.save();
            ctx.translate(x + 14, y - 35);
            ctx.rotate(-Math.PI / 6);
            ctx.fillRect(0, -3, 22, 6);
            ctx.restore();

            // Mão segurando a lança
            ctx.fillStyle = '#B8895A';
            ctx.beginPath();
            ctx.arc(x + 28, y - 50, 4.5, 0, Math.PI * 2);
            ctx.fill();

            // Dedos
            ctx.fillRect(x + 27, y - 48, 2, 4);
            ctx.fillRect(x + 29, y - 48, 2, 4);

            // Pernas
            ctx.fillStyle = '#A0826D';
            ctx.fillRect(x - 12, y - 7, 10, 22);
            ctx.fillRect(x + 2, y - 7, 10, 22);

            // Pés descalços
            ctx.fillStyle = '#9A7148';
            ctx.beginPath();
            ctx.ellipse(x - 7, y + 16, 6, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 7, y + 16, 6, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        };

        const drawFire = (x: number, y: number) => {
            ctx.fillStyle = '#5D4037';
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.PI / 12);
            ctx.fillRect(-12, -2, 24, 4);
            ctx.restore();
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(-Math.PI / 12);
            ctx.fillRect(-12, -2, 24, 4);
            ctx.restore();
            const flicker = Math.sin(fireFlicker) * 0.1 + 1;
            ctx.fillStyle = '#FDD835';
            ctx.beginPath();
            ctx.ellipse(x, y - 15, 8 * flicker, 20 * flicker, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FF6F00';
            ctx.beginPath();
            ctx.ellipse(x, y - 12, 6 * flicker, 15 * flicker, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#D32F2F';
            ctx.beginPath();
            ctx.ellipse(x, y - 8, 4 * flicker, 10 * flicker, 0, 0, Math.PI * 2);
            ctx.fill();
        };

        const drawRocks = () => {
            ctx.fillStyle = '#757575';
            ctx.fillRect(520, 278, 22, 16);
            ctx.fillStyle = '#9E9E9E';
            ctx.fillRect(550, 280, 18, 14);
            ctx.fillStyle = '#616161';
            ctx.fillRect(500, 275, 24, 18);
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
            drawRiver();
            drawTree(110, 280, 45, 30, '#4CAF50');
            drawTree(820, 280, 42, 28, '#66BB6A');
            drawTent(200, 280);
            drawDeer(deerX, 280);
            drawRabbit(380, 280);
            drawCharacter(deerX - 120, 280);
            drawFire(340, 280);
            drawRocks();
        };

        const animate = () => {
            cloudOffset += 0.4;
            birdX += 0.8;
            if (birdX > canvas.width + 20) birdX = -20;
            birdFlap += 0.12;
            waterShimmer += 0.8;
            grassSway += 0.025;
            fireFlicker += 0.08;
            deerX += 0.25;
            if (deerX > canvas.width + 50) deerX = -50;
            deerLegMove += 0.12;
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

export default StoneAgeScene;