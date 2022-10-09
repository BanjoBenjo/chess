export const containsObject = (obj, list) => {
    // Find if the array contains an object by comparing the property value
    if (list.some((move) => move.x === obj.x && move.z === obj.z)) {
        return true
    } else {
        return false
    }
}
