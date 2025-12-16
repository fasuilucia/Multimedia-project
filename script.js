const input=document.getElementById("upload");
const pieces=document.querySelectorAll(".piece");
const cells=document.querySelectorAll(".cell");

input.addEventListener("change",function(e){
    const file=e.target.files[0];
    const image=new Image();
    image.src=URL.createObjectURL(file);

    image.onload=function(){
        const rows=3;
        const cols=3;

        const canvas=document.createElement("canvas");
        const ctx=canvas.getContext("2d");
        const pieceWidth=image.width/cols;
        const pieceHeight=image.height/rows;

        canvas.width=pieceWidth;
        canvas.height=pieceHeight;

        let index=0;
        let pieceImages = []; 
        for(let r=0;r<rows;r++){
            for(let c=0;c<cols;c++){
                ctx.clearRect(0,0,canvas.width,canvas.height);
                ctx.drawImage(image,c*pieceWidth,r*pieceHeight,pieceWidth,pieceHeight,0,0,pieceWidth,pieceHeight);
                const dataURL=canvas.toDataURL("image/png");
                pieceImages.push({
                    image: dataURL,
                    correctCell: index
                });
                index++;
            }
        }
        // Shuffle the piece images array
        for (let i = pieceImages.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pieceImages[i], pieceImages[j]] = [pieceImages[j], pieceImages[i]];
        }
        pieces.forEach((piece, i) => {
            piece.style.backgroundImage = `url(${pieceImages[i].image})`;
            piece.style.backgroundSize = "cover";
            piece.style.backgroundPosition = "center";
            piece.draggable = true;
            piece.dataset.correctCell = pieceImages[i].correctCell;
        });

        // Clear cells
        cells.forEach(cell => {
            cell.innerHTML = '';
            cell.dataset.puzzleIndex = null;
        });

        // Add drag and drop functionality
        pieces.forEach(piece => {
            piece.addEventListener('dragstart', handleDragStart);
        });

        cells.forEach((cell, index) => {
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('drop', (e) => handleDrop(e, index, pieceImages.length));
        });
    };

});

let draggedPiece = null;

function handleDragStart(e) {
    draggedPiece = this;
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e, cellIndex, totalPieces) {
    e.preventDefault();
    
    if (draggedPiece) {
        const correctCellIndex = draggedPiece.dataset.correctCell;
        
        // Store the correct cell index in the cell
        const cell = cells[cellIndex];
        cell.dataset.correctCell = correctCellIndex;
        
        // Clone and display the piece in the cell
        const clonedPiece = draggedPiece.cloneNode(true);
        cell.innerHTML = '';
        cell.appendChild(clonedPiece);
        
        // Check if puzzle is solved
        checkPuzzleCompletion(totalPieces);
        draggedPiece = null;
    }
}

function checkPuzzleCompletion(totalPieces) {
    let allCorrect = true;
    
    // Check all cells: must be filled AND piece must be in correct position
    cells.forEach((cell, cellIndex) => {
        // Cell must have a piece
        if (cell.dataset.correctCell === null || cell.dataset.correctCell === undefined) {
            allCorrect = false;
            return;
        }
        
        // Piece must be in the correct cell position
        if (parseInt(cell.dataset.correctCell) !== cellIndex) {
            allCorrect = false;
        }
    });
    
    // Only show alert when puzzle is completely solved
    if (allCorrect) {
        showCustomAlert();
    }
}

const customAlert = document.getElementById("customAlert");
const congratulationSound = document.getElementById("congratulationSound");

congratulationSound.volume = 0.3;

function showCustomAlert() {
    congratulationSound.currentTime = 0;
    congratulationSound.play().catch((error) => {
        console.log('Audio playback failed:', error);
    });

    customAlert.classList.add("show");
}

function closeCustomAlert() {
    customAlert.classList.remove("show");
}