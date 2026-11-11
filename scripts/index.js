const titleElement = document.getElementById("title");
const subtitleElement = document.getElementById("subtitle");
const menuElement = document.getElementById("menu");
const treeCanvas = document.getElementById("tree-canvas");
const flowerCanvas = document.getElementById("flower-canvas");

function random(a, b) {
    // Random int between two int (a,b)
    const min = Math.ceil(Math.min(a, b));
    const max = Math.floor(Math.max(a, b));
    return min + Math.floor(Math.random() * (max - min + 1));
}

function ajusterCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    canvas.getContext("2d").scale(dpr, dpr);
}

// Texte :

function fadeTextIn(element, delay) {
    return new Promise((resolve) => {
        let text = element.textContent;

        if (text.length == 0) {
            resolve();
            return;
        }

        element.textContent = "";
        element.style.visibility = "visible";

        for (let i = 0; i < text.length; i++) {
            setTimeout(() => {
                element.textContent += text[i];

                if (i == text.length - 1) {
                    resolve();
                }

            }, delay * i);
        }
    });
}

async function displayTitles() {
    await new Promise(r => setTimeout(r, 500));
    await fadeTextIn(titleElement, 150);
    await new Promise(r => setTimeout(r, 500));
    await fadeTextIn(subtitleElement, 50);

    await new Promise(r => setTimeout(r, 500));

    for (const item of menuElement.children) {
        item.style.visibility = "visible";
        item.classList.add("apparition");
        await new Promise(r => setTimeout(r, 500));
    }
}

// Arbre :

function tracerBranche(canvas = treeCanvas, color, widthFrom, widthTo, x1, y1, x2, y2, time) {
    const ctx = canvas.getContext("2d");

    return new Promise((resolve) => {
        let debut = null;
        let dernierX = x1;
        let dernierY = y1;

        function image(temps) {
            if (debut === null) debut = temps;
            const t = Math.min((temps - debut) / time, 1);

            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;

            // L'épaisseur évolue avec la progression, comme la position
            ctx.strokeStyle = color;
            ctx.lineWidth = widthFrom + (widthTo - widthFrom) * t;
            ctx.lineCap = "round";

            ctx.beginPath();
            ctx.moveTo(dernierX, dernierY);
            ctx.lineTo(x, y);
            ctx.stroke();

            dernierX = x;
            dernierY = y;

            if (t < 1) {
                requestAnimationFrame(image);
            } else {
                resolve();
            }
        }

        requestAnimationFrame(image);
    });
}

async function tracerBrancheFixe(canvas = treeCanvas, color, width, x1, y1, x2, y2, time) {
    await tracerBranche(canvas, color, width, width, x1, y1, x2, y2, time);
}

function dessinerFleur(ctx, x, y, L, rotation) {
    const couleurPetales = "#b53a2d";
    const couleurContour = "#9a3126";   // équivalent opaque de l'ancien noir à 15 %
    const couleurCentre = "#853f32";
    const nbPetales = 5;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation * Math.PI / 180);

    ctx.fillStyle = couleurPetales;
    ctx.strokeStyle = couleurContour;
    ctx.lineWidth = Math.max(1, L * 0.03);
    ctx.lineJoin = "round";

    for (let i = 0; i < nbPetales; i++) {
        ctx.save();
        ctx.rotate((i * 2 * Math.PI) / nbPetales);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-0.55 * L, -0.25 * L, -0.55 * L, -0.95 * L, -0.15 * L, -L);
        ctx.quadraticCurveTo(0, -0.85 * L, 0.15 * L, -L);
        ctx.bezierCurveTo(0.55 * L, -0.95 * L, 0.55 * L, -0.25 * L, 0, 0);
        ctx.closePath();

        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    // Centre
    ctx.beginPath();
    ctx.arc(0, 0, L * 0.13, 0, Math.PI * 2);
    ctx.fillStyle = couleurCentre;
    ctx.fill();

    ctx.restore();
}

function bloom(canvas = flowerCanvas, x, y, taille, duree = 600) {
    const ctx = canvas.getContext("2d");
    const rotation = random(0, 360);

    return new Promise((resolve) => {
        let debut = null;

        function image(temps) {
            if (debut === null) debut = temps;
            const t = Math.min((temps - debut) / duree, 1);
            const e = 1 - (1 - t) ** 3;

            dessinerFleur(ctx, x, y, taille * e, rotation);

            if (t < 1) {
                requestAnimationFrame(image);
            } else {
                resolve();
            }
        }

        requestAnimationFrame(image);
    });
}

async function recursiveBranch(startX, startY, startAngle, depth) {
    // startX, startY : coordonnées de départ
    // length : longueur de la branche
    // angle : angle de la branche (en radians)
    // depth : profondeur de récursion

    if (depth == 0) {
        return;
    }

    const radians = startAngle * Math.PI / 180;

    // console.log(radians);

    const length = (Math.max(depth, 10) + Math.trunc(Math.random() * 40));

    const endX = startX + length * Math.cos(radians);
    const endY = startY + length * Math.sin(radians);

    await tracerBrancheFixe(treeCanvas, "#423a30", 10, startX, startY, endX, endY, 200);
    if (Math.random() < 0.25) {
        bloom(flowerCanvas, endX, endY, random(15, 40));
    }

    let splits = 2

    // console.log(splits);

    for (let index = 0; index < splits; index++) {
        let newAngle = 0;
        if (Math.random() < 0.5) {
            newAngle = random(startAngle + 20, startAngle + 45);
        } else {
            newAngle = random(startAngle - 20, startAngle - 45);

        }

        await recursiveBranch(endX, endY, newAngle, Math.trunc(depth / 4));
    }
}



async function displayTree() {
    // Main branch properties
    let x = treeCanvas.width;
    let y = 300;
    let angle;
    let width;
    let lastWidth;
    let length;


    // Draw main branch parts + sub-branches
    for (let index = 0; index < 4; index++) {

        switch (index) {
            case 0:
                length = 520
                angle = 140 + Math.trunc(Math.random() * (20));

                width = 80;
                lastWidth = 80;
                break;

            case 1:
                length = 220
                angle = (-130) + Math.trunc(Math.random() * (-40));
                width = 60;
                break;

            case 2:
                length = 350
                angle = 150 + Math.trunc(Math.random() * (40));
                width = 40;
                break;

            case 3:
                length = 100
                // angle = random((angle - 15), (angle + 15));
                angle = (angle - 15) + Math.trunc(Math.random() * ((angle - 15) - (angle + 15))); // ça rend mieux jsp pk
                width = 15;
                break;

            default:
                angle = 180;
                length = 100;
                width = 40;
        }


        console.log("Branche n°" + index + " : Angle = " + angle + "°");

        const radians = angle * Math.PI / 180;

        const endX = x + length * Math.cos(radians);
        const endY = y + length * Math.sin(radians);


        timeout = (length * 4);
        tracerBranche(treeCanvas, "#423a30", lastWidth, width, x, y, endX, endY, timeout);

        // trouver entre 1 et 3 sous branches :
        let nbSousBranches = random(1, (length/100)+0.5);
        console.log(nbSousBranches);

        for (let index = 0; index < nbSousBranches; index++) {
            // trouver coord aléatoire sur la branche principale
            let pos = random((length * 0.2), (length * 0.8));

            let subAngle = -90;
            if (Math.random() < 0.5) {
                console.log("angle negatif");
                subAngle = random((angle - 30), (angle - 60));
            } else {
                console.log("angle positif");
                subAngle = random((angle + 30), (angle + 60));
            }

            let subX = x + pos * Math.cos(radians);
            let subY = y + pos * Math.sin(radians);
            const delai = timeout * (pos / length);

            setTimeout(() => recursiveBranch(subX, subY, subAngle, random(10, 50)), delai);


        }

        await new Promise(r => setTimeout(r, timeout));



        lastWidth = width;
        console.log("Tracé !");

        x = endX;
        y = endY;
    }
}


ajusterCanvas(treeCanvas);
ajusterCanvas(flowerCanvas);

async function main() {
    await displayTitles();
    await displayTree();

}

main();