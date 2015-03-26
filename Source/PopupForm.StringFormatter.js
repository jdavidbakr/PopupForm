/*
---

description: A toolset to auto-format strings in a form. Includes an extension of PopupForm.AjaxForm
  to extend that class so all you have to do is link this file and use the PopupForm.AjaxForm as you
  would otherwise.

license: MIT-style

name: PopupForm.StringFormatter

author:
 - Jon Baker

provides:
 - PopupForm.StringFormatter

requires:
 - PopupForm.AjaxForm

...
*/

PopupForm.StringFormatter = new Class({
    // This class is used to format numeric strings i.e. for phone numbers, credit cards, etc
    // To use, implement this into any class that needs it and you'll have the format_template function
    Implements: Options,
    options: {
        phone_format: '(XXX) XXX-XXXX',
        zip_format: 'XXXXX',
        date_format: 'XX/XX/XXXX',
        routing_format: 'XXXXXXXXX',
        ssn_format: 'XXX-XX-XXXX'
    },
    // Default values for the card types, this can be changed upstream
    visa: 'Visa',
    mastercard: 'MasterCard',
    discover: 'Discover',
    amex: 'American Express',
    initialize: function(op) {
        this.setOptions(op);
    },
    format_template: function(string, template) {
        var newstring = '';
        var length;

        length = string.length;
        if (length > template.length) {
            length = template.length;
        }
        // Strip out any non-numeric characters and make a properly formatted number
        var t = 0;
        var ch;
        for (i = 0; i < length; i++) {
            //ch = string[i];
            ch = string.substring(i, i + 1);
            if ((ch >= '0' && ch <= '9') || ch == '-' || ch == '(' || ch == ')' || ch == '.' || ch == '/') {
                while (template.substring(t, t + 1) != 'X' && t < length) {
                    newstring = newstring + template.substring(t, t + 1);
                    t++;
                }
                if (ch >= '0' && ch <= '9') {
                    newstring = newstring + ch;
                    t++;
                }
            }
        }
        return newstring;
    },
    format_other: function(string, template) {
        return this.format_template(string, template);
    },
    format_phone: function(string) {
        return this.format_template(string, this.options.phone_format);
    },
    format_zip: function(string) {
        return this.format_template(string, this.options.zip_format);
    },
    format_date: function(string) {
        return this.format_template(string, this.options.date_format);
    },
    format_routing: function(string) {
        return this.format_template(string, this.options.routing_format);
    },
    format_ssn: function(string) {
        return this.format_template(string, this.options.ssn_format);
    },
    format_numeric: function(string) {
        return this.format_numeric_only(string);
    },
    format_numeric_only: function(string) {
        var newstring = '';
        var length;

        length = string.length;

        // Strip out any non-numeric characters and make a properly formatted number
        var ch;
        var decimal_used;
        var decimal_places = 2;
        decimal_used = false;
        for (i = 0; i < length; i++) {
            //ch = string[i];
            ch = string.substring(i, i + 1);
            if (decimal_used) {
                decimal_places = decimal_places - 1;
            }


            if (ch >= '0' && ch <= '9' && decimal_places >= 0) {
                newstring = newstring + ch;
            }
            if (ch == '.' && !decimal_used) {
                decimal_used = true;
                newstring = newstring + ch;

            }
        }
        return newstring;
    },
    format_cc: function(entry, cc_type_field) {
        var visatemplate = 'XXXX XXXX XXXX XXXX';
        var amextemplate = 'XXXX XXXXXX XXXXX';
        var template;
        var card;
        var firstChar = entry.substring(0, 1);

        // Find out what card from the number
        switch (firstChar) {
            case '4':
                card = this.visa;
                template = visatemplate;
                break;
            case '5':
                card = this.mastercard;
                template = visatemplate;
                break;
            case '6':
                card = this.discover;
                template = visatemplate;
                break;
            case '3':
                card = this.amex;
                template = amextemplate;
                break;
            default:
                return '';
                break;
        }
        if ($chk(cc_type_field)) {
            cc_type_field.set('value', card);
            cc_type_field.fireEvent('blur');
        }
        return this.format_template(entry, template);
    }
});

// Extend PopupForm.AjaxForm
PopupForm.AjaxForm = new Class({
    Extends: PopupForm.AjaxForm,
    Implements: PopupForm.StringFormatter,
    options: {
        total_count_selector: '.total_count', // Fields that will be summed for the total
        total_field_id: 'total_field', // The field that will contain the total
        total_text_id: 'total_text', // The id for the text that will display the total
        phone_number_selector: '.telephone', // Fields that will be formatted for telephone
        zip_number_selector: '.zip', // Fields that will be formatted for zip (4 numeric digits)
        date_selector: '.format_date', // Fields that will be formatted for date
        numeric_selector: '.numeric_only', // Fields that will be formatted for numbers only
        cc_field_selector: '.cc_num', // Fields that will be formatted for cc numbec
        cc_type_selector: '.cc_type', // The CC type select element
        routing_number_selector: '.routing', // For routing number (9-digits)
        ssn_selector: '.ssn',
        repeating_selector: '.repeating',
        repeating_button: '.repeating_button',
        repeating_delete: '.remove_repeating'
    },
    initialize: function(form, op) {
        this.parent(form, op);
        this.setOptions(op);
        // Initialize hooks.  If we have child objects created we can call this on them
        // to get the hooks set for just that child.
        this.init_hooks(form);
    },
    init_hooks: function(form) {
        // Total calculator
        form.getElements(this.options.total_count_selector).each(function(item) {
            item.addEvent('keyup', this.update_totals.bind(this));
            // In case there's already a value here
            item.fireEvent('keyup');
        }, this);
        // Phone numbers
        form.getElements(this.options.phone_number_selector).each(function(item) {
            item.store('ajax_form', this);
            item.addEvent('keyup', this.format_phone_field); // No bind, we want this to reference the field
        }, this);
        // Zip Codes
        form.getElements(this.options.zip_number_selector).each(function(item) {
            item.store('ajax_form', this);
            item.addEvent('keyup', this.format_zip_field); // No bind, we want this to reference the field
        }, this);
        // Dates
        form.getElements(this.options.date_selector).each(function(item) {
            item.store('ajax_form', this);
            item.addEvent('keyup', this.format_date_field); // No bind, we want this to reference the field
        }, this);
        // Numbers Only
        form.getElements(this.options.numeric_selector).each(function(item) {
            item.store('ajax_form', this);
            item.addEvent('keyup', this.format_numeric_field); // No bind, we want this to reference the field
        }, this);
        // Credit cards
        form.getElements(this.options.cc_field_selector).each(function(item) {
            item.store('ajax_form', this);
            item.addEvent('keyup', this.format_cc_field); // Bind to field, not this class
            // cc fields should not be autofill
            item.set('autocomplete', 'off');
        }, this);
        // Routing Numbers
        form.getElements(this.options.routing_number_selector).each(function(item) {
            item.store('ajax_form', this);
            item.addEvent('keyup', this.format_routing_field); // No bind, we want this to reference the field
        }, this);
        // Social Securyt Numbers
        form.getElements(this.options.ssn_selector).each(function(item) {
            item.store('ajax_form', this);
            item.addEvent('keyup', this.format_ssn_field); // No bind, we want this to reference the field
        }, this);
        // Repeating sections will be empty to start with, so we'll need to load up the first item
        // and attach events to add additional items.
        form.getElements(this.options.repeating_selector).each(this.prep_repeating.bind(this));
    },
    update_totals: function() {
        // Get the total and update the appropriate fields
        var total = 0;
        $$(this.options.total_count_selector).each(function(item) {
            var my_value = item.get('value');
            var length = my_value.length;
            var new_value = '';
            for (i = 0; i < length; i++) {
                ch = my_value.substring(i, i + 1);
                if ((ch >= '0' && ch <= '9') || ch == '.') {
                    new_value = new_value + ch;
                }
            }
            if (my_value != new_value) {
                item.set('value', new_value);
            }
            my_value = new_value.toFloat();
            if (my_value > 0) {
                if (my_value != my_value.toFixed(2)) {
                    my_value = my_value.toFixed(2);
                    item.set('value', my_value);
                }
                total += my_value.toFloat();
            }
        });
        var total_field = $(this.options.total_field_id);
        if ($chk(total_field)) {
            total_field.set('value', total.round(2));
        }
        var total_text = $(this.options.total_text_id);
        if ($chk(total_text)) {
            total_text.set('html', total.toFixed(2));
        }
    },
    format_other_field: function(item, template) {
        // Need to pass the field
        var ajax_form = item.retrieve('ajax_form');
        var old_value = item.get('value');
        var new_value = ajax_form.format_other(old_value, template);
        if (old_value != new_value) {
            item.set('value', new_value);
        }
    },
    format_phone_field: function() {
        // this is the field we're operating on
        var ajax_form = this.retrieve('ajax_form');
        var format = this.get('format');

        if ($chk(format)) {
            var old_value = this.get('value');
            var new_value = ajax_form.format_template(old_value, format);
            if (old_value != new_value) {
                this.set('value', new_value);
            }
        } else {
            var old_value = this.get('value');
            var new_value = ajax_form.format_phone(old_value);
            if (old_value != new_value) {
                this.set('value', new_value);
            }
        }
    },
    format_zip_field: function() {
        // this is the field we're operating on
        var ajax_form = this.retrieve('ajax_form');
        var format = this.get('format');

        if ($chk(format)) {
            var old_value = this.get('value');
            var new_value = ajax_form.format_template(old_value, format);
            if (old_value != new_value) {
                this.set('value', new_value);
            }
        } else {
            var old_value = this.get('value');
            var new_value = ajax_form.format_zip(old_value);
            if (old_value != new_value) {
                this.set('value', new_value);
            }
        }
    },
    format_date_field: function() {
        // this is the field we're operating on
        var ajax_form = this.retrieve('ajax_form');

        var old_value = this.get('value');
        var new_value = ajax_form.format_date(old_value);
        if (old_value != new_value) {
            this.set('value', new_value);
        }
    },
    format_cc_field: function() {
        var ajax_form = this.retrieve('ajax_form');
        // The type should be previous to the card number
        var cc_type_field = this.getPrevious(ajax_form.options.cc_type_selector);
        if (!$chk(cc_type_field)) {
            // Vinny's forms have tables!  Yuck!  This should help.
            cc_type_field = document.getElement(ajax_form.options.cc_type_selector);
        }
        var old_value = this.get('value');
        var new_value = ajax_form.format_cc(old_value, cc_type_field);
        if (old_value != new_value) {
            this.set('value', new_value);
        }
    },
    format_routing_field: function() {
        // this is the field we're operating on
        var ajax_form = this.retrieve('ajax_form');

        var old_value = this.get('value');
        var new_value = ajax_form.format_routing(old_value);
        if (old_value != new_value) {
            this.set('value', new_value);
        }
    },
    format_ssn_field: function() {
        // this is the field we're operating on
        var ajax_form = this.retrieve('ajax_form');

        var old_value = this.get('value');
        var new_value = ajax_form.format_ssn(old_value);
        if (old_value != new_value) {
            this.set('value', new_value);
        }
    },
    format_numeric_field: function() {
        // this is the field we're operating on
        var ajax_form = this.retrieve('ajax_form');

        var old_value = this.get('value');
        var new_value = ajax_form.format_numeric(old_value);
        if (old_value != new_value) {
            this.set('value', new_value);
        }
    },
    prep_repeating: function(item) {
        // make sure we have the "add" button
        var button = item.getElement(this.options.repeating_button);
        if ($chk(button)) {
            // We have a button so we can continue
            // Store the callback url in the button
            var rel = item.get('rel');
            var decode = JSON.decode(rel);
            var do_not_show = false;
            if ($chk(decode)) {
                // We have JSON in the rel tag
                button.store('callback_url', decode.url);
                do_not_show = decode.do_not_show;
            } else {
                // No JSON in the rel tag, so the rel should just be the callback url.
                button.store('callback_url', item.get('rel'));
            }
            button.store('ajax_form', this);
            // Add the click event to the button
            button.addEvent('click', this.add_repeating_form); // bind to the button
            // Fire the click event to get the first form
            if (!do_not_show) {
                button.fireEvent('click');
            }
        }
    },
    add_repeating_form: function() {
        var ajax_form = this.retrieve('ajax_form');
        // get the callback url
        var url = this.retrieve('callback_url');
        var load_content = function() {
            new Request({'url': url,
                onSuccess: function(html) {
                    var new_item = new Element('div', {
                        'html': html
                    }).inject(this, 'before');
                    var remove_button = new_item.getElement(ajax_form.options.repeating_delete);
                    if ($chk(remove_button)) {
                        remove_button.addEvent('click', function() {
                            var remove_function = function() {
                                // Dispose of the box
                                new_item.dispose();
                                // Re-calculate the totals
                                ajax_form.update_totals();
                                if (ajax_form.use_spinner) {
                                    ajax_form.spinner.hide();
                                }
                            }
                            if (ajax_form.options.use_spinner) {
                                ajax_form.spinner.fx_chain(remove_function());
                                ajax_form.spinner.show();
                            } else {
                                remove_function();
                            }
                        });
                    }
                    // Init the hooks in this new form
                    ajax_form.init_hooks(new_item);
                }.bind(this)
            }).post();
        }.bind(this);
        // Perform the request to get the content and insert it before the button
        if (ajax_form.options.use_spinner) {
            ajax_form.spinner.fx_chain(function() {
                load_content();
                ajax_form.spinner.hide();
            }.bind(this));
            ajax_form.spinner.show();
        } else {
            load_content();
        }
    }
});
