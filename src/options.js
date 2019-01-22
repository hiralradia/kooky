// Saves options to chrome.storage
function save_options() {
  var aggresive_caching = document.getElementById('aggresive-caching-checkbox').checked;
  var ultimate_protection = document.getElementById('ultimate-protection-checkbox').checked;

  var slider_vals = document.getElementById('slider').noUiSlider.get();
  var hours_higher = slider_vals[0];
  var hours_lower = slider_vals[1];

  var preserve_login_cookies = document.getElementById('preserve-login-cookies-checkbox').checked;
  var preserve_login_cookies_list = document.getElementById('login-cookies-whitelist').value;



  chrome.storage.sync.set({
    aggresive_caching: aggresive_caching,
    ultimate_protection:ultimate_protection,
    hours_higher: hours_higher,
    hours_lower: hours_lower,
    preserve_login_cookies : preserve_login_cookies,
    preserve_login_cookies_list:preserve_login_cookies_list
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status').textContent = 'Options saved.';
    setTimeout(function() {
      document.getElementById('status').textContent = '';
    }, 750);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value color = 'red' and likesColor = true.
  chrome.storage.sync.get({
    aggresive_caching: true,
    ultimate_protection:false,
    hours_higher: 7*24,
    hours_lower: 0,
    preserve_login_cookies : true,
    preserve_login_cookies_list:''
  }, function(items) {
    console.log(items.aggresive_caching);
    console.log(items.ultimate_protection);
    if (document.getElementById('aggresive-caching-checkbox').checked != items.aggresive_caching){
      document.getElementById('aggresive-caching-checkbox').click();
    }
    if (document.getElementById('preserve-login-cookies-checkbox').checked != items.aggresive_caching){
      document.getElementById('preserve-login-cookies-checkbox').click();
    }
    if (document.getElementById('ultimate-protection-checkbox').checked != items.ultimate_protection){
      document.getElementById('ultimate-protection-checkbox').click();
    }

    document.getElementById('slider').noUiSlider.set([items.hours_higher,items.hours_lower]);
    document.getElementById('login-cookies-whitelist').textContent = items.preserve_login_cookies_list;

  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save-btn').addEventListener('click',
    save_options);


// Create UI Elements
var slider = document.getElementById('slider');

noUiSlider.create(slider, {
    start: [0, 168],
    connect: true,
    range: {
        'min': 0,
        'max': 200
    },
    tooltips: [wNumb({decimals: 0, suffix:"h"}), wNumb({decimals: 0, suffix:"h"})]
});

// Register callbacks
$('#aggresive-caching-checkbox').on("change",function(){
  save_options();
});

$('#preserve-login-cookies-checkbox').on("change",function(){
  // if preserve-login-cookies is ticked, make sure ultimate-protection-checkbox is off
  var preserve_login_val = document.getElementById('preserve-login-cookies-checkbox').checked;
  if (preserve_login_val && (preserve_login_val == document.getElementById('ultimate-protection-checkbox').checked)){
    document.getElementById('ultimate-protection-checkbox').click();
  }
  save_options();
});

$('#ultimate-protection-checkbox').on("change",function(){
  // if ultimate-protection-checkbox is ticked, make sure preserve-login-cookies-checkbox is off
  var ultimate_protection_val = document.getElementById('ultimate-protection-checkbox').checked;
  if (ultimate_protection_val && (ultimate_protection_val == document.getElementById('preserve-login-cookies-checkbox').checked)){
    document.getElementById('preserve-login-cookies-checkbox').click();
  }
  save_options();
});

$('#slider').noUiSlider.on("change",function(){
  save_options();
});