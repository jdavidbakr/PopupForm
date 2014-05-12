/*
---
requires: PopupForm/PopupForm
...
*/

window.addEvent('domready',init_page);

function init_page() {
    $$('.popup_form').each(function(popup) {
        var popup_form = new PopupForm(popup, {
            'content_processor': function(html) {
                html.getElements('.ajax_form').each(function(ajax_form) {
                    var ajax = new PopupForm.AjaxForm(form);
                });
            }
        });
    });

}
