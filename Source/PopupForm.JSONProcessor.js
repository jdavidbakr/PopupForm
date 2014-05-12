/*
---

description: Handy tools to process a JSON response. Designed to work with PopupForm.AjaxForm but can be used directly.

license: MIT-style

name: PopupForm.JSONProcessor

authors:
 - Jon Baker
 - Kenneth Jackson

requires:
 - Core/Request.JSON
 - Core/Request.HTML
 - More/Form.Validator.Inline
 - More/Form.Validator.Extras
 - Core/Fx.Tween
 - PopupForm

provides: PopupForm.JSONProcessor

...
*/

/*
 When the form is submitted, a JSON data structure is expected in the response.  It can contain:

 message: an alert message will contain this to display to the user
 redirect: this can contain a URL that the page is redirected to
 redirect_blank: This can contain a URL that the page is redirected to but the script continues to evaluate.
 fields: an array of fields that we want to set within the form [{field:id,value:name},{field:id,value:name}]
 target: If there is no target_selector in the options, this is also tested to see if it exists to be used as a target
 html: populate the target_selector DOM with this html.
 setHTML: Replaces the HTML of the form.
 elements: An array of elements we can take action on.  For each item in this array, we can have:
 - target: A selector to choose the element'ss target. Required.
 - html: Put this html into target. Default is to replace.
 - add_to_target: Instead of relacing the HTML content, we will append it to the end.
 - add_to_target_location: Where to inject (optional, defaults to "bottom")
 - sortable_target: If the target is sortable, this is the master element that contains the sortable instance that we will attach this item to
 - attributes: An array of actions to perform on the target's attributes.  Each item in the array can have the following properties:
 - - addClass: Adds this class to the target
 - - removeClass: Removes this class from the target
 - - setProperty: An object defining a property we will set.  Attributes are "property" and "value".
 load_div: a selector for a DOM element to load.  Requires url
 url: The url for load_div
 keep_open: If true, will not close the form.
 delete_dom: a selector (id) of a DOM element we want to have deleted.
 highlight: A selector to execute the Element.highlight() function on. Can be an array of selectors.
 execute: a function that we want to execute upon completion
 fire_event: 2-part array, first is an id, second is the event to fire on that element.

 Options:
 submit_selector: The selector for the object within the form to execute the submit action. The class will also execute on the form's submit action.
 target_selector: Default target, if one doesn't exist in the json response.
 content_processor: A function to call on any HTML that is injected. Passed the parent dom element as a single argument.
 highlight_color_start: The color for the highlight, leave null for default #ff8
 highlight_color_end: The color for the highlight to end, leave null for the default background color
 */

PopupForm.JSONProcessor = new Class({
    Implements: Options,
    options: {
        submit_selector: null,
        target_selector: null, // If set and html is returned in the json, fill object with the html
        content_processor: $empty, // Function to execute on content if loaded
        highlight_color_start: null,
        highlight_color_end: null
    },
    initialize: function(item, op) {
        if (item) {
            this.item = item;
        }
        this.setOptions(op);
    },
    form_success: function(json) {
        if (json) {
            // Check for a message
            if (json.message) {
                alert(json.message);
            }

            // Check for a redirect
            if (json.redirect) {
                document.location.href = json.redirect;
            }
            // Check for a redirect_blank
            if (json.redirect_blank) {
                window.open(json.redirect_blank, '_blank');
            }
            // Check for fields to set
            if (json.fields) {
                json.fields.each(function(field) {
                    if ($(field.field)) {
                        $(field.field).set('value', field.value);
                        $(field.field).fireEvent('update');
                    }
                });
            }
            var target;
            if (this.options.target_selector) {
                target = $(this.options.target_selector);
            } else if (json.target) {
                target = $(json.target);
            }
            if (json.html && target) {
                if (json.add_to_target) {
                    var htmlelement = new Element('div');
                    htmlelement.set('html', json.html);
                    if (json.add_to_target_location) {
                        htmlelement.inject(target, json.add_to_target_location);
                    } else {
                        htmlelement.inject(target);
                    }
                } else {
                    target.set('html', json.html);
                }
                this.options.content_processor(target);
                // We can receive json.sortable_target to add the target to the sortable instance
                // stored in sortable_target
                if (json.sortable_target && $(json.sortable_target)) {
                    var sortable = $(json.sortable_target).retrieve('sortable');
                    if ($chk(sortable)) {
                        sortable.addLists(target.getChildren());
                    }
                }
            }

            if (json.setHtml && this.item) {
                this.item.set('html', json.setHtml);
                this.options.content_processor(this.item);
            }

            if (json.elements) {
                json.elements.each(function(element) {
                    var target;
                    if (element.target) {
                        target = $(element.target);
                        if (element.html) {
                            if (element.add_to_target) {
                                var htmlelement = new Element('div');
                                htmlelement.set('html', element.html);
                                if (element.add_to_target_location) {
                                    htmlelement.inject(target, element.add_to_target_location);
                                } else {
                                    htmlelement.inject(target);
                                }
                            } else {
                                target.set('html', element.html);
                            }
                            this.options.content_processor(target);
                            // We can receive element.sortable_target to add the target to the sortable instance
                            // stored in sortable_target
                            if ($chk(element.sortable_target) && $chk($(element.sortable_target))) {
                                var sortable = $(element.sortable_target).retrieve('sortable');
                                if ($chk(sortable)) {
                                    sortable.addLists(target.getChildren());
                                }
                            }
                        }
                        if (element.attributes) {
                            element.attributes.each(function(attribute) {
                                if (attribute.addClass) {
                                    target.addClass(attribute.addClass);
                                }
                                if (attribute.removeClass) {
                                    target.removeClass(attribute.removeClass);
                                }
                                if (attribute.setProperty) {
                                    if (attribute.setProperty.property) {
                                        target.setProperty(attribute.setProperty.property, attribute.setProperty.value);
                                    }
                                }

                            }.bind(this));
                        }
                    }
                }.bind(this));
            }

            if (json.load_div && json.url) {
                // Load url into load_div
                var load_div = $(json.load_div);
                if (load_div) {
                    var req = new Request.HTML({
                        'url': json.url,
                        'update': load_div,
                        onComplete: function() {
                            this.options.content_processor(load_div);
                            load_div.fireEvent('change');
                        }.bind(this)
                    }).post();
                }
            }
            if (json.delete_dom) {
                var delete_dom = $(json.delete_dom);
                if ($chk(delete_dom)) {
                    delete_dom.destroy();
                }
            }

            if (json.highlight) {
                if ((typeOf(json.highlight) == 'array')) {
                    json.highlight.each(function(element) {
                        var highlight_target = $(element);
                        highlight_target.highlight(this.highlight_color_start, this.highlight_color_end);
                    });
                } else {
                    var highlight_target = $(json.highlight);
                    highlight_target.highlight(this.highlight_color_start, this.highlight_color_end);
                }
            }

            if (json.execute) {
                eval(json.execute);
            }
            if (json.fire_event && json.fire_event[0] && json.fire_event[1]) {
                var target = $(json.fire_event[0]);
                if (target) {
                    target.fireEvent(json.fire_event[1]);
                }
            }
        }
    }
})