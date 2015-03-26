PopupForm
=========

This series of classes creates a popup element that can contain a form that will be
processed via an AJAX callback upon submission. The additional components can be used independently if desired.

How to use
----------

Simply attach this to any elements (anchor tags usually) you would like to open the form when clicked:

    <a class="popup_form" url="the_form.html">Click Here</a>

and in your javascript:

    $$('.popup_form').each(function(popup) {
        var popup_form = new PopupForm(popup, {
            'content_processor': function(html) {
                html.getElements('.ajax_form').each(function(ajax_form) {
                    var ajax = new PopupForm.AjaxForm(ajax_form);
                });
            }
        });
    });

Note that you need to attach the AjaxForm class to the form within the response; it does not happen automatically.

PopupForm Options
------------------

When an element that has been attached to the PopupForm is clicked, a Mask is created,
and an element with the class 'over_mask" is created as well.  You will need to style the
mask and over_mask so that the z-index of the over_mask places it above the mask, which
will cover the entire screen.  Any elements with a class 'cancel' will close the form, as well
as if the user hits the escape key.

Here are the options available with the PopupForm:

* container_class: This is the class will be assigned to the object that should display above the mask.
* mask_options: Options passed to the Mask object.
* show_mask_immediately: Set to false to show the mask after loading, otherwise the mask will conver the page immediately when clicked. Default is true.
* popup_id: ID to give the popup container so we can easily access it to close it.
* posting_data: The posting data (query string) when getting the form
* cancel_selector: The selector for any cancel buttons. Defaults to 'cancel'
* any_click_cancels: Set to true to close the form on any click at the window level. Default: false
* esc_closes: Whether the escape key will close the form. Defaults to true.
* close_anchor: Apply this to an anchor to close the form but don't stop the event (i.e. a target _blank)
* content_processor: Function to process the content of the form once it's loaded. Note that we are using this in the above example to attach any ajax forms.
* event_type: The event type to listen for.  Can be click, dblclick, keyup, etc.  Defaults to 'click.'
* url: The URL to open into the form. If null, will use the rel tag or href tag
* onSuccess: Function to process after a successful form submission
* onOpen: Function to call when a popup form is fired. Passed the event.
* onClose: Function to call when the popup form is closed. Passed the resulting json.

JSONProcessor Options
---------------------

When the form is submitted, a JSON data structure is expected in the response.  It can contain:

* message: an alert message will contain this to display to the user
* redirect: this can contain a URL that the page is redirected to
* redirect_blank: This can contain a URL that the page is redirected to but the script continues to evaluate.
* fields: an array of fields that we want to set within the form [{field:id,value:name},{field:id,value:name}]
* target: If there is no target_selector in the options, this is also tested to see if it exists to be used as a target
* html: populate the target_selector DOM with this html.
* setHTML: Replaces the HTML of the form.
* elements: An array of elements we can take action on.  For each item in this array, we can have:
    * target: A selector to choose the element'ss target. Required.
    * html: Put this html into target. Default is to replace.
    * add_to_target: Instead of relacing the HTML content, we will append it to the end.
    * add_to_target_location: Where to inject (optional, defaults to "bottom")
    * sortable_target: If the target is sortable, this is the master element that contains the sortable instance that we will attach this item to
    * attributes: An array of actions to perform on the target's attributes.  Each item in the array can have the following properties:
        * addClass: Adds this class to the target
        * removeClass: Removes this class from the target
        * setProperty: An object defining a property we will set.  Attributes are "property" and "value".
* load_div: a selector for a DOM element to load.  Requires url
* url: The url for load_div
* keep_open: If true, will not close the form.
* delete_dom: a selector (id) of a DOM element we want to have deleted.
* highlight: A selector to execute the Element.highlight() function on. Can be an array of selectors.
* execute: a function that we want to execute upon completion
* fire_event: 2-part array, first is an id, second is the event to fire on that element.

Here are the options for the class:
* submit_selector: The selector for the object within the form to execute the submit action. The class will also execute on the form's submit action.
* target_selector: Default target, if one doesn't exist in the json response.
* content_processor: A function to call on any HTML that is injected. Passed the parent dom element as a single argument.
* highlight_color_start: The color for the highlight, leave null for default #ff8
* highlight_color_end: The color for the highlight to end, leave null for the default background color

AjaxForm Options
----------------

The AjaxForm class changes the behavior of a form element so that it can be processed via AJAX rather
than being submitted and a new page loading.  The posting URL should be in the rel tag of the form container,
or can be the action for the form.  This form actually extends the JSONProcessor class.

The form will have an additional input, name set in options.ajax_form_field, with a value of "1".
Use this to verify that the form was indeed submitted via the ajax form, or if the user had javascript turned off.
It also posts a variable 'HTTP_REFERER' (options.referer_field) that contains the URL of the referer, for
IE who doesn't pass that in the headers.

When the form is submitted, the resulting JSON is passed to the JSONProcessor.  In addition, the following can be returned:
* If a message is returned, the form will not execute the completion function unless a value for execute_complete is passed as well.
* clear_form: Will reset the form.
* keep_open: Do not execute the complete function
* execute_complete: Execute the complete function, regardless of any decisions prior.

The complete function will normally be attached to the PopupForm class, but you can create your own if you want to
use this outside of the PopupForm.

An optional spinner may be used during the form processing.

Store in the form 'onSubmit' a function to execute when the form is submitted.
Store 'onComplete' a function to execute when the form submission gets returned, receives the json as the argument
Store 'onFail' a function to execute if the form submission fails, receives the json as the argument

You can require confirmation by putting in the rel tag an object with key 'confirm' and the confirmation message.

If you want to upload a file, you can do that with an file input element.  The form will automatically
create an iframe to process the upload, and will also set the enctype correctly.  Treat the upload like any
other form submission.

Here are the options for the AjaxForm class:

* use_validator: Whether to use the Form.Validator on the form
* use_inline_validator: If using a validator, set to true to use the inline version.
* onElementPass: For the form validator
* onElementFail: For the form validator
* onFormValidate: For the form validator
* onFormSuccess: For the form validator
* use_spinner: Whether to spin() the form on submission.  If false, the hidden_class will be applied to the form.
* spinner_container: The container to be passed to the Spinner class. Defaults to null
* spinner_options: The options passed to the Spinner class.
* ajax_form_field: The field we will inject into the form to verify that it was submitted by javascript. Default 'ajax_form'
* referer_field: The name of the field we will inject that contains the URL of the page we are on.  Default 'HTTP_REFERER',
* submit_selector: If the submit button is not going to actually submit the form, this is the selector to activate the submit action. Defaults to null.
* remove_custom_submit_events: If true, remove any custom submit events. Defaults to true.
* hidden_class: The class we will apply to the form when submitted if we are not using a spinner.  Default 'hidden'
* force_iframe_class: add this class to the form force an iframe even if no file element is found. Default 'force_iframe'

StringFormatter Options
----------------
PopupForm.StringFormatter includes an extendor for PopupForm.AjaxForm so that all of the hooks
are automatically added. It forces formatting on fields based on a template. Several formatting
options are bundled by default, but it is easy to add additional formatting options and override the default
formatting if desired.

Simply assign the class to the fields to get it to hook into the formatter:
* telephone: formats a phone number (XXX) XXX-XXXX
* zip: formats a zip code XXXXX
* format_date: forces a date format XX/XX/XXXX
* numeric_only: requires numbers 
* cc_num: Credit card number (with spaces between number blocks)
* cc_type: Optional, if a select element has this class it will change to the appropriate card type based on the number being entered
* routing: Bank routing number (9 digits) XXXXXXXXX
* ssn: Social Security Number XXX-XX-XXXX

Also included is a summing total based on fields within the form. As the individual fields are updated, the total value
automatically updates.
 * total_count: assign this class to all fields to be used in the summation
 * total_field: the ID for the input element that will contain the calculated total
 * total_text: the ID for any dom element that should display the total as text (will have its html injected into)

Here is a sample to extend into other field types - use this in a file the requires PopupForm.StringFormatter

    PopupForm.AjaxForm = new Class({
      Extends: PopupForm.AjaxForm,
    
      options: {
        code_format: 'XX-XXX-XX',
        code_format_selector: '.email_code'
      },
    
      init_hooks: function(form) {
        this.parent(form);
        // Code formatter
        form.getElements(this.options.code_format_selector).each(function(item) {
          item.store('ajax_form',this);
          item.addEvent('keyup',function() {
            this.format_other_field(item,this.options.code_format);
          }.bind(this));
        },this);
      }
    });

