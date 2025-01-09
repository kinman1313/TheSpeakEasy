const GIPHY_API_KEY = 'DO7ARGJtRRks2yxeAvolAIBFJqM74EPV';
const GIPHY_API_URL = 'https://api.giphy.com/v1/gifs';

export const searchGifs = async (query, limit = 20, offset = 0) => {
    try {
        const response = await fetch(
            `${GIPHY_API_URL}/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&rating=g`
        );
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching GIFs:', error);
        return [];
    }
};

export const getTrendingGifs = async (limit = 20) => {
    try {
        const response = await fetch(
            `${GIPHY_API_URL}/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&rating=g`
        );
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error('Error fetching trending GIFs:', error);
        return [];
    }
}; 