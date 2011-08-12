$(document).ready(function(){
  var patterns = new Array();
  var comments = new Array();
  var current_pattern = 0;

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
        render_list();
      }
    });
    $("#components").disableSelection();
  
    $(".button").button();
    $("#export_dialog").dialog({ autoOpen: false, width: 'auto' });

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
      var bit_label = $("<li/>").appendTo($("#bit_labels"))
      bit_label.text("bit" + (15-i));
      if (i<8) bit_label.addClass("hi-bit-title");
      // create a containing li, set the data about segment 
      var component_container = $("<li class='ui-state-default'/>").appendTo($("#components"));
      var segment_image = lookup_segment_image(i);
      component_container.data("seg", i);
      component_container.data("pin", (segment_image.length > 0 ? segment_image.data("pin") : 0));
      
      // create a component
      var component = $("<div class='component'/>").appendTo(component_container);
      // add text showing segment number
      $("<div/>").appendTo(component).addClass("seg").text((i==0 ? "-" : i));
      // add text showing pin number 
      $("<div/>").appendTo(component).addClass("pin").text((i==0 ? "-" : component_container.data("pin")));
      // set intial state to 0
      component_container.data("state", 0);
      component.addClass("bit_is_0");          
    }
    
    sort_by_segments();
 }

 function sort_by_segments()
 {
  $("#components li").sortElements(function(a, b){
    return $(a).data("seg") > $(b).data("seg") ? -1 : 1;
  });
  render_state();
  render_list();
 }
 
 function sort_by_pins()
 {
  $("#components li").sortElements(function(a, b){
    return $(a).data("pin") > $(b).data("pin") ? -1 : 1;
  });
  render_state();
  render_list();
 }
 
 
  function reverse()
  {
    $("#components li").reverseOrder();
    render_state();
    render_list();
  }
  
 
 // calculate the current pattern to current_pattern
 function serialize_current_pattern()
 {
    var i = 0;
    
    current_pattern = 0;
    $("#components li").each(function() {
      current_pattern += $(this).data("state") * Math.pow(2, $(this).data("seg"));
      i++;
    });
 }
 

 function map_pattern_to_bits(pattern)
 {
    var i = 15;
    var bits = 0;
    var seg;
    $("#components li").each(function() {
      seg = $(this).data("seg");
      bits += ((pattern >> seg) & 0x01) << i;
      i--;
    });
    return bits;
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
    // serialize and display current pattern
    serialize_current_pattern();
    var bits = map_pattern_to_bits(current_pattern);
    
    $("#value_dec").text(bits);
    $("#value_hex").text(value_as_hex(bits));
    $("#value_bin").text(value_as_binary(bits));
  }

  function render_list()
  {
    var tr, bits;
    var export_code = "";
    
    $("#value_table").children().remove();
    //$("#value_table").text("Values:");
    $.each(patterns, function(index, pattern) {
      bits = map_pattern_to_bits(pattern);
      
      tr = $("<tr/>").appendTo($("#value_table"));
      $("<td width='5%' class='number'/>").appendTo(tr).text(index);
      $("<td width='10%' class='number'/>").appendTo(tr).text(bits);
      $("<td width='10%' class='number'/>").appendTo(tr).text(value_as_hex(bits));
      $("<td width='30%' class='number'/>").appendTo(tr).text(value_as_binary(bits));
      $("<td width='45%' class='comment'/>").appendTo(tr).text("// " + comments[index]);
      
      export_code += value_as_hex(bits) + ", // " + index.toString() + " - " + comments[index] + "\n"
    });
    
    
    $("#value_table_container").animate({ scrollTop: $("#value_table_container").attr("scrollHeight") }, 3000);  
    
    $("#export_text").val("uint16_t pattern[] = {\n" + export_code + "};\n");
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
    patterns.push(current_pattern);
    comments.push($("#value_comment").val()); 
    render_list();
    // clear comment ready for next patter
    $("#value_comment").val("");
  });

  // clear the list of patterns
  $("#clear_values").click(function() {
    patterns = new Array();
    comments = new Array();
    render_list();
  });
 
  $("#export").click(function() {
    var text_area = $("#export_text");
    $("#export_dialog").dialog('open');
    text_area.focus();
    text_area.select();
  });
 
   // fill pattern
  $("#fill_pattern").click(function() {
    $("img.tile").each(function() {
      $(this).data("state", 1); 
     });
    render_state();
  });
  
  // invert pattern
  $("#invert_pattern").click(function() {
    $("img.tile").each(function() {
      $(this).data("state", (($(this).data("state")) == 1 ? 0 : 1)); 
     });
    render_state();
  });  
  
  // clear pattern
  $("#clear_pattern").click(function() {
    $("img.tile").each(function() {
      $(this).data("state", 0); 
     });
    render_state();
  });
  
  $("#sort_segments").click(function() {
    sort_by_segments();
  });
  
  $("#sort_pins").click(function() {
    sort_by_pins();
  });
  
  $("#reverse").click(function() {
    reverse();
  });
  
  
});
