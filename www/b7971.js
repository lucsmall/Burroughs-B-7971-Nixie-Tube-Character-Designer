$(document).ready(function(){
  var values = new Array();
  var comments = new Array();
  var current_value = 0;

  setup();
  render_state();

  function setup()
  {
    var i;
    $("#components").data('noclick', 0);

    // allow the segments to be sorted
    $("#components").sortable({
      placeholder: "ui-state-highlight" ,
      start: function(event, ui) {
        $(this).data('noclick', 1);
      },   
      stop: function() {
        render_state();
      }
    });
    $("#components").disableSelection();
  
    $("#add_value").button();
    $("#clear_values").button();

    // fade down tiles for unselected
    $("img.tile").fadeTo(0, 0.1);
    // set state to 0
    $("img.tile").data("state", 0); 
    // set the "title" for each tile to show info about segment and pin
    $("img.tile").each(function() {
      $(this).attr("title",  "Segment: " + $(this).data("seg") 
        + " (Pin: " + $(this).data("pin") + ")" ); 
     }); 
    // setup the bit/seg/pins 
    for(i=0;i<16;i++) {
      // setup the labels for the bits
      var bit_label = $("<li class='ui-state-default'/>").appendTo($("#bit_labels"))
      bit_label.text("bit" + (15-i));
      if (i<8) bit_label.addClass("hi-bit-title");
      // create a containing li, set the data about segment 
      var component_container = $("<li class='ui-state-default'/>").appendTo($("#components"));
      component_container.data("seg", i);
      // create a component
      var component = $("<div class='component'/>").appendTo(component_container);
      // add text showing segment number
      $("<div/>").appendTo(component).addClass("seg").text((i==0 ? "-" : i));
      // add text showing pin number 
      var segment_image = $("img[data-seg='" + i + "']")
      $("<div/>").appendTo(component).addClass("pin").text(segment_image.data("pin"));
      // set intial state to 0
      component_container.data("state", 0);
      component.addClass("bit_is_0");          
    }
 }
 
 // calculate the current value of the pattern
 function update_current_value()
 {
    var i = 0;
    current_value = 0;
    $("#components li").each(function() {
      current_value += $(this).data("state") << (15-i)
      i++;
    });
 }
 
 function current_value_as_hex()
 {
    return value_as_hex(current_value);
 }
 
 function current_value_as_binary()
 {
    return value_as_binary(current_value);
 }

 function render_state() {
    $("img.tile").each(function(){ 
      var state = $(this).data("state");
      var seg = $(this).data("seg");
      
      // fade up or down segment depending on state
      $(this).fadeTo("fast", (state == 1 ? 1 : 0.1));
      // make the components match with the segments
      $("#components li").each(function() {
        if ($(this).data("seg") == seg) {
          $(this).data("state", state);
          var component = $(this).children().first();
          if (state == 0) {
            component.removeClass("bit_is_1");
            component.addClass("bit_is_0");
          } else {
            component.removeClass("bit_is_0");
            component.addClass("bit_is_1");
          }
        }
      });
    }); 
    // update and display current value
    update_current_value();
    $("#value_dec").text(current_value);
    $("#value_hex").text(current_value_as_hex());
    $("#value_bin").text(current_value_as_binary());
  }

  function render_list()
  {
    var tr;
    $("#value_table").children().remove();
    //$("#value_table").text("Values:");
    $.each(values, function(index, value) { 
      tr = $("<tr/>").appendTo($("#value_table"));
      $("<td width='10%' class='number'/>").appendTo(tr).text(value);
      $("<td width='10%' class='number'/>").appendTo(tr).text(value_as_hex(value));
      $("<td width='30%' class='number'/>").appendTo(tr).text(value_as_binary(value));
      $("<td width='50%' class='comment'/>").appendTo(tr).text("// " + comments[index]);
    });
  }

  function lookup_segment_image(segment_number)
  {
    return $("img[data-seg='" + segment_number + "']");    
  }

  function toggle_state(segment_image)
  {
    segment_image.data("state",(segment_image.data("state") == 0 ? 1 : 0)); 
  }

  // EVENTS

  // toggle segment when clicked on
  $("img.tile").click(function() {
    toggle_state($(this));
    render_state();
  });
  
  // toggle corresponding segment when component clicked on
  $("#components li").click(function() {
    if ($("#components").data('noclick') == 1) {
      $("#components").data('noclick', 0);
      return;
    }
    toggle_state(lookup_segment_image($(this).data("seg")));
    render_state();
  });
    
  // highlight a segment when hovered over
  $("img.tile").hover(function () {
      $(this).addClass("hilite");
    }, function () {
      $(this).removeClass("hilite");
  });

  // add the current pattern to the list
  $("#add_value").click(function() {
    values.push(current_value);
    comments.push($("#value_comment").val()); 
    render_list();
    // clear comment ready for next patter
    $("#value_comment").val("");
  });

  // clear the list of patterns
  $("#clear_values").click(function() {
    values = new Array();
    comments = new Array();
    render_list();
  });
});
