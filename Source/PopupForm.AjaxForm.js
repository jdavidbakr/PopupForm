/*
---
description: Makes a form processed via AJAX. Can be used independently of the PopupForm class if desired.

license: MIT-Style

name: PopupForm.AjaxForm

authors:
 - Jon Baker

requires:
 - Core/Request.JSON
 - Core/Request.HTML
 - More/Spinner
 - More/Form.Validator.Inline
 - More/Form.Validator.Extras
 - PopupForm.JSONProcessor

provides: PopupForm.AjaxForm

...
*/

/*
 AjaxForm is a class that will submit a form via Ajax so you don't have to actually submit the form.
 The posting URL should be in the rel tag of the form container, or can be the action for the form.
 
 The form will have an additional input, name set in options.ajax_form_field, with a value of "1".
 Use this to verify that the form was indeed submitted via the ajax form, or if the user had javascript turned off.
 It also posts a variable 'HTTP_REFERER' (options.referer_field) that contains the URL of the referer, for
 IE who doesn't pass that in the headers.
 
 When the form is submitted, a JSON data structure is expected.  It can contain:
 
 message: an alert message will contain this to display to the user
 redirect: this can contain a URL that the page is redirected to
 redirect_blank: This can contain a URL that the page is redirected to but the script continues to evaluate.
 fields: an array of fields that we want to set within the form [{field:id,value:name},{field:id,value:name}]
 target: If there is no target_selector in the options, this is also tested to see if it exists to be used as a target
 html: populate the target_selector DOM with this html.
 sortable_target: If the target is sortable, this is the master element that contains the sortable instance
 load_div: a selector for a DOM element to load.  Requires url
 url: The url for load_div
 keep_open: If true, will not close the form.
 delete_dom: a selector (id) of a DOM element we want to have deleted.
 execute: a function that we want to execute upon completion
 fire_event: 2-part array, first is an id, second is the event to fire on that element.
 
 An optional spinner may be used during the form processing.  See the options for details.
 
 Store in the form 'onSubmit' a function to execute when the form is submitted.
 Store 'onComplete' a function to execute when the form submission gets returned, receives the json as the argument
 Store 'onFail' a function to execute if the form submission fails, receives the json as the argument
 
 You can require confirmation by putting in the rel tag an object with key 'confirm' and the confirmation message.
 
 If you want to upload a file, you can do that with an <input type="file"> element.  The form will automatically
 create an iframe to process the upload, and will also set the enctype correctly.  Treat the upload like any
 other form submission.
 */

PopupForm.AjaxForm = new Class({
    Extends: PopupForm.JSONProcessor,
    Implements: Options,
    options: {
        use_validator: false,
        use_inline_validator: true, // If using a validator, set to true to use the inline version.
        onElementPass: $empty,
        onElementFail: $empty,
        onFormValidate: $empty,
        onFormSuccess: $empty,
        use_spinner: false,
        ajax_form_field: 'ajax_form',
        referer_field: 'HTTP_REFERER',
        spinner_container: null,
        prevent_enter: false, // If true, the enter key will not submit the form
        spinner_options: {
            message: 'Please Wait...',
            fxOptions: {duration: 300}
        },
        submit_selector: null,
        remove_custom_submit_events: true, // Remove any custom submit events
        target_selector: null, // If set and html is returned in the json, fill object with the html
        content_processor: $empty, // Function to execute on content if loaded
        hidden_class: 'hidden',
        force_iframe_class: 'force_iframe' // add this class to force an iframe even if no file element is found.
    },
    initialize: function (form, op) {
        var current_form = form.retrieve('current_form');
        if ($chk(current_form)) {
            return;
        } else {
            form.store('current_form', this);
        }
        this.setOptions(op);
        this.form = form;
        // Remove any custom submit events
        if (this.options.remove_custom_submit_events) {
            form.removeEvents('submit');
        }
        form.addEvent('submit', function (event) {
            if ($chk(event)) {
                event.stop();
                if (this.options.prevent_enter) {
                    if (event.key == 'enter') {
                        return;
                    }
                }
            }
            this.submit_form(event);
        }.bind(this));
        if (this.options.submit_selector) {
            form.getElements(this.options.submit_selector).each(function (submit) {
                submit.addEvent('click', function (e) {
                    form.fireEvent('submit');
                    e.stop();
                });
            });
        }
        // Attach a submit event to all input and select elements on keyup = 'enter'
        if (!this.options.prevent_enter) {
            form.getElements('input').each(function (input) {
                input.addEvent('keydown', function (e) {
                    if (e.key == 'enter') {
                        form.fireEvent('submit');
                        e.stop();
                    }
                });
            });
            form.getElements('select').each(function (input) {
                input.addEvent('keydown', function (e) {
                    if (e.key == 'enter') {
                        form.fireEvent('submit');
                        e.stop();
                    }
                });
            });
        }
        if (this.options.use_spinner) {
            this.spinner = new Spinner(this.options.spinner_container, this.options.spinner_options);
        }
        if (this.options.use_validator) {
            // Attach a validator but we don't want it to submit the form
            if (this.options.use_inline_validator) {
                this.validator = new Form.Validator.Inline(form, {
                    evaluateOnSubmit: false,
                    onElementPass: this.options.onElementPass,
                    onElementFail: this.options.onElementFail,
                    onFormValidate: this.options.onFormValidate
                });
            } else {
                this.validator = new Form.Validator(form, {
                    serial: false,
                    evaluateOnSubmit: false,
                    onElementPass: this.options.onElementPass,
                    onElementFail: this.options.onElementFail,
                    onFormValidate: this.options.onFormValidate
                });
            }
        }
        // Look to see if we have any files, if we do we have to submit the form through an iframe.
        var has_file = false;
        form.getElements('input').each(function (item) {
            if (item.get('type') == 'file') {
                has_file = true;
            }
        });
        if (has_file || form.hasClass(this.options.force_iframe_class)) {
            var id = 'iframe_' + $random(1000000000, 9999999999);
            this.iframe = new IFrame({
                'name': id,
                'style': 'display: none'
                        //}).inject(form.getParent());
                        // injecting into the parent form caused an infinite 'loadeng' state when the iframe is destroyed.
            }).inject($(document.body));
            form.set('method', 'post');
            form.set('enctype', 'multipart/form-data');
            form.set('target', id);
        }
    },
    get_label: function (item) {
        // When passed an item, returns the label if we can find it.
        var label;
        label = item.getPrevious('label');
        if (label) {
            return label;
        }
        label = item.getNext('label');
        if (label) {
            return label;
        }
        // If the item is a radio, try again with it's parent
        if (item.hasClass('radio')) {
            return this.get_label(item.getParent());
        }
    },
    submit_form: function (e) {
        // Check for a confirm in the rel tag
        var rel = this.form.get('rel');
        if ($chk(rel)) {
            try {
                var rel = JSON.decode(rel);
                if ($chk(rel) && $chk(rel.confirm)) {
                    if (!confirm(rel.confirm)) {
                        return;
                    }
                }
            }
            catch (err) {
                // If rel is not a valid json, this will fail, so this is just to prevent any errors.
            }
        }
        /*
         if (this.options.use_spinner) {
         this.spinner.position();
         this.spinner.show();
         }
         */
        var submit_action = this.form.retrieve('onSubmit');
        if ($chk(submit_action)) {
            submit_action();
        }

        if ($chk(this.iframe)) {
            // Must set this here or it will fire on initial load
            this.iframe.removeEvents('load');
            this.iframe.addEvent('load', this.form_success.bind(this));
        }
        var ajax_element = new Element('input', {
            'type': 'hidden',
            'name': this.options.ajax_form_field,
            'value': '1'
        }).inject(this.form);
        var referer_element = new Element('input', {
            'type': 'hidden',
            'name': this.options.referer_field,
            'value': window.location.href
        }).inject(this.form);

        var req = new Request.JSON({'url': this.form.get('action'),
            'data': this.form.toQueryString(),
            onSuccess: this.form_success.bind(this),
            onFailure: this.form_failure.bind(this),
            onError: this.form_failure.bind(this)
        });
        ajax_element.dispose();
        referer_element.dispose();
        var validated = true;
        if (this.options.use_validator) {
            validated = this.form.retrieve('validator').validate();
        }
        if (validated) {
            // Analytics?
            try {
                _gaq.push(['_trackEvent', 'Form', 'Submit', this.form.get('action')]);
            } catch (err) {
                // Do nothing if we fail
            }
            if (this.options.use_spinner) {
                this.spinner.position();
                this.spinner.show();
                if ($chk(this.iframe)) {
                    this.form.submit();
                } else {
                    req.post();
                }
            } else {
                if (this.options.hidden_class) {
                    this.form.addClass(this.options.hidden_class);
                }
                if ($chk(this.iframe)) {
                    this.form.submit();
                } else {
                    req.post();
                }
            }
        } else {
            var fail_action = this.form.retrieve('onFail');
            if (fail_action) {
                fail_action('[]');
            }
        }
    },
    form_failure: function () {
        if (this.options.use_spinner) {
            this.spinner.hide();
        }
        alert('An error has occurred. Please try again.');
    },
    form_success: function (json) {
        this.options.onFormSuccess(json);
        if (this.options.hidden_class) {
            this.form.removeClass(this.options.hidden_class);
        }
        var execute_complete = true;
        // If we have an iframe, json needs to be pulled out of it
        if (this.iframe) {
            // Surely there is a mootools method for this but I can't seem to find it.
            // This came from http://roneiv.wordpress.com/2008/01/18/get-the-content-of-an-iframe-in-javascript-crossbrowser-solution-for-both-ie-and-firefox/
            var content = this.iframe.contentWindow.document.body.innerHTML;
            if (content) {
                json = JSON.decode(content);
            }
        }
        if (json) {
            this.parent(json);

            // Check for a message and disable execute_complete if there was one
            if ($chk(json.message)) {
                execute_complete = false;
            }
            if (json.clear_form) {
                // Clear the from
                this.form.reset();
            }
            // Turn off the spinner
            if (this.options.use_spinner && !$chk(json.redirect)) {
                this.spinner.hide();
            }
            if (json.keep_open) {
                execute_complete = !json.keep_open;
            }
            if (json.execute_complete) {
                execute_complete = true;
            }
        } else {
            // Turn off the spinner
            if (this.options.use_spinner) {
                this.spinner.hide();
            }
        }
        if (execute_complete) {
            var complete_action = this.form.retrieve('onComplete');
            if (complete_action) {
                complete_action(json);
            }
        } else {
            var fail_action = this.form.retrieve('onFail');
            if (fail_action) {
                fail_action(json);
            }
        }
    },
    process_content: function (div) {
        // Call the parent content processor
        this.parent(div);
        // See if we have a processContent stored in the form
        var processContent = this.form.retrieve('processContent');
        if (processContent) {
            processContent(div);
        }
    }
});
