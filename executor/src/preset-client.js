/**
 * Load preset configuration from preset-db service.
 * @param {string} presetName
 */
export async function fetchPresetConfig(presetName) {
    const res = await fetch(`http://preset-db/config/${presetName}`)
    const data = await res.json()
    if (!data.ok) {
        throw new Error(data.error)
    }
    return data.data
}
