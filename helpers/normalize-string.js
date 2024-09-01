function normalizeString(str) {
    // Convert to lowercase
    str = str.toLowerCase();
    
    // Replace spaces with hyphens
    str = str.replace(/\s+/g, '-');
    
    // Remove special characters (keep alphanumeric and hyphens)
    str = str.replace(/[^a-z0-9-]/g, '');
    
    return str;
}

module.exports = normalizeString;