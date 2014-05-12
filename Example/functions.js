function init_page() {
    $$('.popup_form').each(function(popup) {
        var popup_form = new PopupForm(popup, {
            'content_processor': function(html) {
                html.getElements('.ajax_form').each(function(ajax_form) {
                    var ajax = new PopupForm.AjaxForm(ajax_form);
                });
            }
        });
    });

}

window.addEvent('domready',init_page);
