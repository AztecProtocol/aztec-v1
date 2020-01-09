class HexString extends String {
    slice(a, b = null) {
        if (b) {
            return super.slice(a * 2, b * 2);
        }
        return super.slice(a * 2);
    }

    hexLength() {
        return this.length / 2;
    }
}

export default HexString;
