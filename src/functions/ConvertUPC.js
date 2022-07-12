export default function convertUPC(upc) {
    return new Promise((resolve, reject) => {

        const API_KEY = "10A3F2C862703FBC";

        const API = `https://eandata.com/feed/?v=3&keycode=${API_KEY}&mode=json&find=${upc}`;
        fetch(API).then(res => res.json()).then(res => {
            resolve(res);
        })
    })
}