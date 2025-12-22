const input = document.getElementById("upload");
const pieces = document.querySelectorAll(".piece");
const cells = document.querySelectorAll(".cell");

input.addEventListener("change", function (e) {
    const file = e.target.files[0];
    const image = new Image();
    image.src = URL.createObjectURL(file);

    image.onload = function () {
        const rows = 3;
        const cols = 3;

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const pieceWidth = image.width / cols;
        const pieceHeight = image.height / rows;

        canvas.width = pieceWidth;
        canvas.height = pieceHeight;

        let index = 0;
        let pieceImages = [];
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(image, c * pieceWidth, r * pieceHeight, pieceWidth, pieceHeight, 0, 0, pieceWidth, pieceHeight);
                const dataURL = canvas.toDataURL("image/png");
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

        // Clear cells and restore pieces
        cells.forEach(cell => {
            cell.innerHTML = '';
            cell.dataset.puzzleIndex = null;
        });

        // Make all pieces visible again
        pieces.forEach(piece => {
            piece.style.display = 'flex';
        });

        // Add drag and drop functionality
        pieces.forEach(piece => {
            piece.addEventListener('dragstart', handleDragStart);
        });

        cells.forEach((cell, index) => {
            cell.addEventListener('dragover', handleDragOver);
            cell.addEventListener('drop', (e) => handleDrop(e, index, pieceImages.length));
        });

        // Add drop zone for pieces row (to move pieces back from grid)
        const piecesRow = document.getElementById('pieces_row');
        piecesRow.addEventListener('dragover', handleDragOver);
        piecesRow.addEventListener('drop', handleDropToPiecesRow);
    };

});

let draggedPiece = null;
let draggedFromCell = null; // Track if piece is dragged from a grid cell

function handleDragStart(e) {
    draggedPiece = this;
    draggedFromCell = null; // Reset - this is from pieces row
    e.dataTransfer.effectAllowed = 'move';
}

function handleCellDragStart(e, cellIndex) {
    const cell = cells[cellIndex];
    if (cell.firstChild) {
        draggedPiece = cell.firstChild;
        draggedFromCell = cellIndex; // Track which cell it's from
        e.dataTransfer.effectAllowed = 'move';
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDropToPiecesRow(e) {
    e.preventDefault();

    // Only allow dropping from grid cells (not from pieces row itself)
    if (draggedFromCell !== null) {
        const sourceCell = cells[draggedFromCell];
        const pieceIndex = parseInt(sourceCell.dataset.pieceIndex);

        // Clear the grid cell
        sourceCell.innerHTML = '';
        sourceCell.dataset.correctCell = null;
        sourceCell.dataset.pieceIndex = null;

        // Show the piece back in the pieces row
        pieces[pieceIndex].style.display = 'flex';

        draggedPiece = null;
        draggedFromCell = null;
    }
}

function handleDrop(e, cellIndex, totalPieces) {
    e.preventDefault();

    if (draggedPiece) {
        const targetCell = cells[cellIndex];

        // CASE 1: Dragging from pieces row to grid
        if (draggedFromCell === null) {
            const correctCellIndex = draggedPiece.dataset.correctCell;

            // If cell already has a piece, return it to the pieces row
            if (targetCell.firstChild && targetCell.dataset.pieceIndex !== undefined) {
                const pieceIndex = parseInt(targetCell.dataset.pieceIndex);
                pieces[pieceIndex].style.display = 'flex';
            }

            targetCell.dataset.correctCell = correctCellIndex;

            // Find which piece in the pieces array this is
            let pieceIndex = -1;
            pieces.forEach((piece, index) => {
                if (piece === draggedPiece) {
                    pieceIndex = index;
                }
            });

            // Store the piece index in the cell
            targetCell.dataset.pieceIndex = pieceIndex;

            // Move the piece to the cell
            const movedPiece = draggedPiece.cloneNode(true);
            movedPiece.draggable = true;
            movedPiece.addEventListener('dragstart', (e) => handleCellDragStart(e, cellIndex));

            targetCell.innerHTML = '';
            targetCell.appendChild(movedPiece);

            // Hide the original piece from the pieces row
            draggedPiece.style.display = 'none';
        }
        // CASE 2: Dragging from grid to grid
        else {
            const sourceCell = cells[draggedFromCell];

            // Don't drop on the same cell
            if (draggedFromCell === cellIndex) {
                draggedPiece = null;
                draggedFromCell = null;
                return;
            }

            // If target cell is empty, just move the piece
            if (!targetCell.firstChild) {
                const movedPiece = draggedPiece.cloneNode(true);
                movedPiece.draggable = true;
                movedPiece.addEventListener('dragstart', (e) => handleCellDragStart(e, cellIndex));

                targetCell.innerHTML = '';
                targetCell.appendChild(movedPiece);
                targetCell.dataset.correctCell = sourceCell.dataset.correctCell;
                targetCell.dataset.pieceIndex = sourceCell.dataset.pieceIndex;

                // Clear source cell
                sourceCell.innerHTML = '';
                sourceCell.dataset.correctCell = null;
                sourceCell.dataset.pieceIndex = null;
            }
            // If target cell has a piece, swap them
            else {
                const targetPiece = targetCell.firstChild;
                const targetCorrectCell = targetCell.dataset.correctCell;
                const targetPieceIndex = targetCell.dataset.pieceIndex;

                // Clone both pieces
                const movedPiece = draggedPiece.cloneNode(true);
                const swappedPiece = targetPiece.cloneNode(true);

                // Make them draggable
                movedPiece.draggable = true;
                swappedPiece.draggable = true;

                movedPiece.addEventListener('dragstart', (e) => handleCellDragStart(e, cellIndex));
                swappedPiece.addEventListener('dragstart', (e) => handleCellDragStart(e, draggedFromCell));

                // Swap the pieces
                targetCell.innerHTML = '';
                targetCell.appendChild(movedPiece);
                targetCell.dataset.correctCell = sourceCell.dataset.correctCell;
                targetCell.dataset.pieceIndex = sourceCell.dataset.pieceIndex;

                sourceCell.innerHTML = '';
                sourceCell.appendChild(swappedPiece);
                sourceCell.dataset.correctCell = targetCorrectCell;
                sourceCell.dataset.pieceIndex = targetPieceIndex;
            }
        }

        // Check if puzzle is solved
        checkPuzzleCompletion(totalPieces);
        draggedPiece = null;
        draggedFromCell = null;
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

// Undo button - removes last placed piece
const undoButton = document.getElementById("undo");
undoButton.addEventListener("click", function () {
    // Find the last filled cell
    for (let i = cells.length - 1; i >= 0; i--) {
        if (cells[i].firstChild && cells[i].dataset.pieceIndex !== undefined) {
            // Get which piece was in this cell
            const pieceIndex = parseInt(cells[i].dataset.pieceIndex);

            // Clear the cell
            cells[i].innerHTML = '';
            cells[i].dataset.correctCell = null;
            cells[i].dataset.pieceIndex = null;

            // Restore the specific piece to the pieces row
            pieces[pieceIndex].style.display = 'flex';
            break;
        }
    }
});

// Give Up button - solves the puzzle automatically
const giveUpButton = document.getElementById("give-up");
giveUpButton.addEventListener("click", function () {
    // Place each piece in its correct cell
    pieces.forEach((piece, index) => {
        const correctCellIndex = parseInt(piece.dataset.correctCell);
        const cell = cells[correctCellIndex];

        // Clone the piece and place it in the correct cell
        const solvedPiece = piece.cloneNode(true);
        solvedPiece.draggable = true;
        solvedPiece.addEventListener('dragstart', (e) => handleCellDragStart(e, correctCellIndex));

        cell.innerHTML = '';
        cell.appendChild(solvedPiece);

        // Store the data for correct tracking
        cell.dataset.correctCell = correctCellIndex;
        cell.dataset.pieceIndex = index;

        // Keep pieces visible in the pieces row (initial state)
        piece.style.display = 'flex';
    });

    // Show completion alert
    checkPuzzleCompletion(pieces.length);
});