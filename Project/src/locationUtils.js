export const getUserLocation = (onSuccess, onError) => {
    if (navigator.geolocation) {
        console.log("Geolocation is supported");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log("Geolocation success", position);
                onSuccess(position);
            },
            (error) => {
                console.log("Geolocation error", error);
                onError(error);
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
};

export const showError = (error) => {
    switch(error.code) {
        case error.PERMISSION_DENIED:
            alert("User denied the request for Geolocation.");
            break;
        case error.POSITION_UNAVAILABLE:
            alert("Location information is unavailable.");
            break;
        case error.TIMEOUT:
            alert("The request to get user location timed out.");
            break;
        case error.UNKNOWN_ERROR:
            alert("An unknown error occurred.");
            break;
        default:
            alert("An unknown error occurred.");
            break;
    }
};