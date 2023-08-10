export function convertToBase64(file){
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.replace(/^data:.+;base64,/, ''));
        reader.onerror = error => reject(error);
    });
}
