/*
---
description: Attaches an event to open a popup form that is processed via AJAX.

license: MIT-style

authors:
 - Jon Baker

provides: PopupForm

requires:
 - More/Mask
 - Core/Options
 - Core/Event
 - Core/Selectors
 - Core/Request.HTML
...
*/

// the PopupForm class activates an element to draw a popup window on top of a Mask.
// Designed for a form, but I guess it could be used with just regular html, as long as you have a cancel button
// to close the mask.

// Store the URL in the rel tag or the href tag

// Built to works with AjaxForm but not required.  Expects AjaxForm to be attached with the content_processor.

var PopupForm = new Class({
    Implements: Options,
    close_form_function: null, // The function for the close event (so we can remove it)
    esc_test_bound: null, // the bound function for the keyup event
    popup_avialable: true, // Flag to prevent double-clicking from opening the form twice
    container: null, // The container

    options: {
        container_class: 'over_mask', // The class for the form container
        mask_options: {
            onShow: function() {
                this.element.setStyle('position', 'fixed');
            }
        },
        show_mask_immediately: true, // Set to false to show the mask after loading
        popup_id: 'popup_item', // ID to give the popup container so we can easily access it to close it.
        posting_data: null, // The posting data (query string) when getting the form
        cancel_selector: '.cancel', // The selector for any cancel buttons
        any_click_cancels: false, // Set to true to close the form on any click at the window level
        esc_closes: true, // Set to false to prevent the escape key from closing the popup
        close_anchor: '.close_anchor', // Apply this to an anchor to close the form but don't stop the event (i.e. a target _blank)
        content_processor: $empty, // Function to process the content of the form once it's loaded
        event_type: 'click', // The event type to listen for.  Can be click, dblclick, keyup, etc.
        url: null, // If null, will use the rel tag or href tag
        onSuccess: $empty, // Function to process after a successful form submission
        onOpen: $empty, // Function to cass when a popup form is fired. Passed the event.
        onClose: $empty // Function to call when the popup form is closed. Passed the resulting json.
    },
    initialize: function(item, op) {
        // Make sure we haven't processed this item yet
        var current_form = item.retrieve('popup_form');
        if ($chk(current_form)) {
            return;
        } else {
            item.store('popup_form', this);
        }
        this.setOptions(op);
        this.item = item;
        // Create the mask
        // Add a click event for the item
        item.addEvent(this.options.event_type, this.open_form.bind(this));

        // Any anchors within here should not propagate
        item.getElements('a').each(function(a) {
            a.addEvent(this.options.event_type, function(e) {
                e.stopPropagation();
            });
        },this);

        this.close_form_function = function(e) {
            e.stop();
            this.close_form(e);
        }.bind(this);
    },
    set_posting_data: function(data) {
        this.options.posting_data = data;
    },
    open_form: function(event) {
        if (event) {
            event.stop();
        }
        if (!this.popup_avialable) {
            return;
        }
        this.popup_avialable = false;
        this.options.onOpen(event);
        this.mask = new Mask(null, this.options.mask_options);
        if (this.options.show_mask_immediately) {
            this.mask.show();
        }
        this.container = new Element('div', {
            'class': this.options.container_class,
            'id': this.options.popup_id,
            'name': this.options.popup_id
        }).inject($(document.body));
        this.container.store('popup_form', this);

        var url = this.options.url;
        if (!$chk(url)) {
            url = this.item.get('rel');
        }
        // Adding functionality to check for the href tag
        if (!$chk(url)) {
            url = this.item.get('href');
        }
        this.container.store('popup_form', this);

        var req = new Request.HTML({
            'url': url,
            'data': this.options.posting_data,
            onSuccess: this.process_form.bind(this),
            'update': this.container
        }).post();
        // Analytics?
        try {
            _gaq.push(['_trackEvent', 'Popup Form', 'Open', url]);
        } catch (err) {
            // Do nothing if we fail
        }
    },
    process_form: function() {
        this.process_form_content(this.container);
    },
    process_form_content: function(container) {
        //this.mask.show();
        container.getElements(this.options.cancel_selector).each(function(item) {
            item.addEvent('click', this.close_form_function);
        }, this);
        if (this.options.any_click_cancels) {
            this.mask.addEvent('click', this.close_form_function);
        }
        if (this.options.esc_closes) {
            this.esc_test_bound = this.esc_test.bind(this);
            $(document.body).addEvent('keyup', this.esc_test_bound);
        }
        container.getElements(this.options.close_anchor).each(function(item) {
            // Don't use the close_formr_function here because we want the event to propogate
            item.addEvent('click', this.close_form.bind(this));
        }, this);
        container.getElements('form').each(this.store_data_into_form.bind(this));
        this.options.content_processor(container);
        // Move the document scroll to the top, saving the current scroll location
        this.saved_scroll = $(document.body).getScroll();
        $(document.body).scrollTo(0, 0);
        this.mask.position();
        this.mask.show();
    },
    esc_test: function(e) {
        if (e.key == 'esc') {
            this.close_form();
        }
    },
    store_data_into_form: function(form) {
        form.store('onSubmit', function() {
            this.container.addClass(this.options.hidden_class);
        }.bind(this));
        form.store('onComplete', this.close_form.bind(this));
        form.store('processContent', this.process_form_content.bind(this));
    },
    close_form: function(json) {
        // Make sure we have a form
        if (!this.container) {
            return;
        }
        // If we receive a value 'redo' in the json, re-draw the form.
        if (json && json.redo) {
            this.container.removeClass(this.options.hidden_class);
        } else {
            // No redo, so goodbye to the form
            if (this.options.tips) {
                this.options.tips.hide();
            }
            this.container.dispose();
            this.container = null;
            if ($type(json) != 'event' && $type(json) != 'domevent') {
                // Only fire success if this isn't the cancel event
                this.options.onSuccess(json);
            }
            this.mask.destroy();
            this.popup_avialable = true;
            if ($chk(this.saved_scroll)) {
                $(document.body).scrollTo(this.saved_scroll.x, this.saved_scroll.y);
            }
            if (this.options.any_click_cancels) {
                this.mask.removeEvent('click', this.close_form_function);
            }
            this.options.onClose(json);
            if (this.esc_test_bound) {
                $(document.body).removeEvent('keyup', this.esc_test_bound);
            }
        }
    }
});
