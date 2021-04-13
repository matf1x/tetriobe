// Get the navigation
const navigation = document.getElementById('navigation');

// Listen for scrolling on the page
window.addEventListener('scroll', () => {
    // Get the Y position
    const scrollObject = {
        x: window.pageXOffset,
        y: window.pageYOffset
    }

    // If we scrolled 75 or more, add the minimize class
    if(scrollObject.y >= 75) {
        navigation.classList.add('minimize');
    } else {
        navigation.classList.remove('minimize');
    }
})