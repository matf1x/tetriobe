// Get the navigation
const navigation = document.getElementById('navigation');
const mobileMenu = document.getElementsByClassName('mobile-menu-item');

// Listen for scrolling on the page
window.addEventListener('scroll', () => {
    // Get the Y position
    const scrollObject = {
        x: window.pageXOffset,
        y: window.pageYOffset
    }

    // If we scrolled 75 or more, add the minimize class
    if(scrollObject.y >= 150) {
        navigation.classList.add('minimize');
    } else {
        navigation.classList.remove('minimize');
    }
})

// Open the mobile menu
const openMenu = () => {
    for(i = 0; i < mobileMenu.length; i++) {
        mobileMenu[i].classList.toggle('visible');
    }
}