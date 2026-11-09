const titleElement = document.getElementById("title");
const subtitleElement = document.getElementById("subtitle");
const menuElement = document.getElementById("menu");

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
    await fadeTextIn(titleElement, 200);
    await new Promise(r => setTimeout(r, 500));
    await fadeTextIn(subtitleElement, 50);

    await new Promise(r => setTimeout(r, 500));

    for (const item of menuElement.children) {
        item.style.visibility = "visible";
        item.classList.add("apparition");
        await new Promise(r => setTimeout(r, 500));
    }
}


displayTitles();