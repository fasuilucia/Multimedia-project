const input=document.getElementById("upload");
const pieces=document.querySelectorAll(".piece");

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
                pieceImages.push(dataURL);
                index++;
            }
        }
        for (let i = pieceImages.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pieceImages[i], pieceImages[j]] = [pieceImages[j], pieceImages[i]];
        }
        pieces.forEach((piece, i) => {
            piece.style.backgroundImage = `url(${pieceImages[i]})`;
            piece.style.backgroundSize = "cover";
            piece.style.backgroundPosition = "center";
        });

    };

});
