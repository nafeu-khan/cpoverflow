// services.js
import { getAccessToken } from "../lib/actions";

const apiService = {
    get: async function (url) {
        return this.makeRequest(url, 'GET');
    },

    post: async function(url, data) {
        return this.makeRequest(url, 'POST', data);
    },

    put: async function(url, data) {
        return this.makeRequest(url, 'PUT', data);
    },

    putFormData: async function(url, formData) {
        return this.makeRequestWithFormData(url, 'PUT', formData);
    },

    delete: async function(url) {
        return this.makeRequest(url, 'DELETE');
    },

    makeRequest: async function(url, method, data = null) {
        console.log(method, url, data);
        const token = await getAccessToken();
        
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers
        };

        if (data && method !== 'GET') {
            config.body = JSON.stringify(data);
        }

        return new Promise(async (resolve, reject) => {
            try {
                let response = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}${url}`, config);
                
                // If token expired, try to refresh and retry
                if (response.status === 401 && token) {
                    const refreshSuccess = await this.refreshToken();
                    if (refreshSuccess) {
                        const newToken = await getAccessToken();
                        config.headers['Authorization'] = `Bearer ${newToken}`;
                        response = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}${url}`, config);
                    }
                }

                const json = await response.json();
                console.log('Response:', json);
                resolve(json);
            } catch (error) {
                console.error('API Error:', error);
                reject(error);
            }
        });
    },

    makeRequestWithFormData: async function(url, method, formData) {
        console.log(method, url, formData);
        const token = await getAccessToken();
        
        const headers = {};
        // Don't set Content-Type for FormData, let browser set it with boundary

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers,
            body: formData
        };

        return new Promise(async (resolve, reject) => {
            try {
                let response = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}${url}`, config);
                
                // If token expired, try to refresh and retry
                if (response.status === 401 && token) {
                    const refreshSuccess = await this.refreshToken();
                    if (refreshSuccess) {
                        const newToken = await getAccessToken();
                        config.headers['Authorization'] = `Bearer ${newToken}`;
                        response = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}${url}`, config);
                    }
                }

                const json = await response.json();
                console.log('Response:', json);
                resolve(json);
            } catch (error) {
                console.error('API Error:', error);
                reject(error);
            }
        });
    },

    refreshToken: async function() {
        try {
            const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
            if (!refreshToken) return false;

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_HOST}/api/auth/token/refresh/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ refresh: refreshToken }),
            });

            if (response.ok) {
                const data = await response.json();
                if (typeof window !== 'undefined') {
                    localStorage.setItem('accessToken', data.access);
                }
                return true;
            }
            return false;
        } catch (error) {
            console.error('Token refresh failed:', error);
            return false;
        }
    },

    postWithoutToken: async function(url, data) {
        console.log('postWithoutToken', url, data);
        return new Promise((resolve, reject) => {
            fetch(`${process.env.NEXT_PUBLIC_API_HOST}${url}`, {
                method: 'POST',
                body: data,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(json => {
                    console.log('Response:', json);
                    resolve(json);
                })
                .catch(error => {
                    reject(error);
                });
        });
    }
}

export default apiService;
