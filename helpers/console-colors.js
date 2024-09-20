function consoleColors(color) {
    let colorCode;
    switch (color) {
        case "green":
            colorCode = "\x1b[32m%s\x1b[0m";
            break;
        case "red":
            colorCode = "\x1b[31m%s\x1b[0m";
            break;
        case "yellow":
            colorCode = "\x1b[33m%s\x1b[0m";
            break;
        case "blue":
            colorCode = "\x1b[34m%s\x1b[0m";
            break;
        default:
            break;
    }
    return colorCode;
}

module.exports = consoleColors;