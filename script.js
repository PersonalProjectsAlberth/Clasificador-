// URL donde has subido los archivos del modelo
const URL = "./my_model/"; // Asegúrate de que esta URL apunte a la ubicación correcta

let model, webcam, labelContainer, maxPredictions;

// Función para cargar el modelo y configurar la cámara
async function init(facingMode) {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // Cargar el modelo y los metadatos
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Configuración de la cámara (webcam)
    const constraints = {
        video: {
            facingMode: facingMode
        }
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        video.width = 200;
        video.height = 200;
        document.getElementById("webcam-container").appendChild(video);

        // Crear un canvas para capturar los frames del video
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        document.getElementById("webcam-container").appendChild(canvas);
        const ctx = canvas.getContext('2d');

        // Función para actualizar la cámara y realizar la predicción
        async function loop() {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            await predict(canvas);
            requestAnimationFrame(loop);
        }

        // Iniciar el bucle de predicción
        loop();

        labelContainer = document.getElementById("label-container");
        for (let i = 0; i < maxPredictions; i++) { // Agregar etiquetas para las predicciones
            labelContainer.appendChild(document.createElement("div"));
        }
    } catch (err) {
        console.error("Error al acceder a la cámara: ", err);
        alert("No se pudo acceder a la cámara. Error: " + err.message);
    }
}

// Función para hacer la predicción con el modelo
async function predict(canvas) {
    // Realiza la predicción pasando el canvas de la cámara al modelo
    const prediction = await model.predict(canvas);
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            prediction[i].className + ": " + prediction[i].probability.toFixed(2); // Muestra la clase y su probabilidad
        labelContainer.childNodes[i].innerHTML = classPrediction;
    }
}

// Función para guardar la foto en Local Storage
function savePhoto(canvas) {
    const imageData = canvas.toDataURL("image/png"); // Convierte el canvas a una imagen base64
    localStorage.setItem("savedPhoto", imageData); // Guarda la imagen en Local Storage
    alert("Foto guardada en Local Storage");
}

// Función para cargar la foto guardada desde Local Storage y realizar predicción
function loadPhoto() {
    const savedPhoto = localStorage.getItem("savedPhoto");
    if (savedPhoto) {
        const img = document.createElement("img");
        img.src = savedPhoto;
        img.style.marginTop = "20px";
        img.onload = async () => {
            // Crear un canvas temporal para procesar la imagen cargada
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Realizar predicción con el modelo
            const prediction = await model.predict(canvas);

            // Mostrar los resultados en el contenedor de resultados
            const resultContainer = document.getElementById("result-container");
            resultContainer.innerHTML = ""; // Limpiar resultados previos
            prediction.forEach(pred => {
                const resultElement = document.createElement("div");
                resultElement.textContent = `${pred.className}: ${pred.probability.toFixed(2)}`;
                resultContainer.appendChild(resultElement);
            });
        };

        // Agregar la imagen cargada al DOM (opcional)
        document.body.appendChild(img);
    } else {
        alert("No hay fotos guardadas");
    }
}
