export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (e) => {
      console.error(e);
      reject(e);
    };
  });
}

export function imageToBlob(img: HTMLImageElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const cvs = document.createElement('canvas');
    cvs.width = img.width;
    cvs.height = img.height;
    cvs.getContext('2d')?.drawImage(img, 0, 0, img.width, img.height);
    cvs.toBlob((bolb) => {
      bolb ? resolve(bolb) : reject();
    });
  });
}

export async function loadFileFromUrl(url: string) {
  const img = await loadImage(url);
  const blob = await imageToBlob(img);
  return new File([blob], 'x.png', {type: 'image/png'});
}

export async function imageToFile(img: HTMLImageElement): Promise<File> {
  const blob = await imageToBlob(img);
  return new File([blob], 'x.png', {type: 'image/png'});
}

export function base64toFile(dataURI: string, fileName: string) {
  let byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0) {
    byteString = atob(dataURI.split(',')[1]);
  } else {
    byteString = unescape(dataURI.split(',')[1]);
  }
  let mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  let ia = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ia], {type: mimeString});
  const file = new File([blob], fileName, {
    type: mimeString,
  });
  console.log(file);
  return file;
}
