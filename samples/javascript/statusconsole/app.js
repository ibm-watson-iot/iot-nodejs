function component() {
    const element = document.createElement('div');

    let client = new ApplicationClient();
    element.innerHTML = 'Hello Dave';

    return element;
}

document.body.appendChild(component());
