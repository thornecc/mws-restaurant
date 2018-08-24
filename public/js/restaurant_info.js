let restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  initMap();
});

/**
 * Initialize leaflet map
 */
initMap = async () => {
  const restaurant = await fetchRestaurantFromURL();
  self.newMap = L.map('map', {
    center: [restaurant.latlng.lat, restaurant.latlng.lng],
    zoom: 16,
    scrollWheelZoom: false
  });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoidGhvcm5lY2MiLCJhIjoiY2prNGd4NjJtMDU2MTN3b3N6amhkOWlmZSJ9.w5foWJEe-aT0t1kPYvVEPg',
    maxZoom: 18,
    attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
    '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
    'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(newMap);
  fillBreadcrumb();
  DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
}

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = async () => {
  if (self.restaurant) { // restaurant already fetched!
    return self.restaurant;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    console.log('No restaurant id in URL');
    return null;
  }
  const restaurant = await DBHelper.fetchRestaurants(id);
  if (!restaurant)
    return;
  self.restaurant = restaurant;
  fillRestaurantHTML();
  return restaurant;
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const picture = document.getElementById('restaurant-img');
  fillRestaurantPicture(picture, restaurant);

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
  // fill reviews
  fillReviewsHTML();
}

/**
 * Create restaurant picture + sources
 */
fillRestaurantPicture = (picture, restaurant) => {
  const sourceSizes = [
    '100vw'
  ].join(', ')
  const sourceWidths = [400, 800];
  const sourceSet = format => sourceWidths.map(
    width => `${DBHelper.imageUrlForRestaurant(restaurant, width, format)} ${width}w`
  ).join(', ');

  const webpSource = document.createElement('source');
  webpSource.sizes = sourceSizes;
  webpSource.srcset = sourceSet('webp');
  webpSource.type = 'image/webp';
  picture.append(webpSource);

  const jpegSource = document.createElement('source');
  jpegSource.sizes = sourceSizes;
  jpegSource.srcset = sourceSet('jpg');
  picture.append(jpegSource);

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = DBHelper.restaurantImageAltText(restaurant);
  picture.append(image);
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
  const container = document.getElementById('reviews-container');

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
  const li = document.createElement('li');
  li.classList.add('card', 'review');

  const header = document.createElement('div');
  header.classList.add('review-header', 'card-header');
  li.appendChild(header);

  const name = document.createElement('span');
  name.innerHTML = review.name;
  name.classList.add('review-name');
  header.appendChild(name);

  const rating = document.createElement('span');
  rating.innerHTML = '★'.repeat(review.rating);
  rating.classList.add('review-rating');
  rating.setAttribute('aria-label', `${review.rating} star${review.rating > 1 ? 's' : ''}`);
  header.appendChild(rating);

  const date = document.createElement('span');
  date.innerHTML = review.date;
  date.classList.add('review-date');
  header.appendChild(date);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  comments.classList.add('review-text');
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  // aria-current="page" is optional, since this item is not a link, but we
  // include it in case we make it a link in future.
  li.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
