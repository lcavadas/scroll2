# scroll2 

Jquery plugin to make scrolls behave and look like the OSX scrolls.

See it in action [here](https://rawgit.com/lcavadas/scroll2/master/scroll2.html)

# Options

<b>size</b>: Size in px for the bars (default is 7)

<b>railColor</b>: Color used for the rail in the scrollbars (default is '#aaa')

<b>barColor</b>: Color used for the bar in the scrollbars (default is '#000'),

<b>timeout</b>: Time of inactivity in ms to hide the scrollbars (default is 1000)

<b>container</b>: object with width and height functions that return the size of the container as a string (ex: '100px', default is '100%' for both height and width as defined in the css)

<b>appendTo</b>: Specify the element to which you want the scrolls to be appended to (deafult is to create a wrapper around the content and append to said wrapper)

<b>vertical</b>: Object containing the vertical bar properties.

<b>horizontal</b>: Object containing the horizontal bar properties.

## Bar Properties

<b>active</b>: Determines if the scroll is active (default is true)

<b>margin</b>: The margin to use for the positioning of the bar (default is 2)

<b>trigger</b>: object with two properties, <b>callback</b> which is a function to be called when the scroll hits the edge and the <b>offset</b> to be used (relating to the edge in px and with a default of 0)

## Default options example

```javascript
{
      size: 7,
      railColor: '#aaa',
      barColor: '#000',
      timeout: 1000,
      container: {
        width: '',
        height: ''
      },
      appendTo: undefined,
      vertical: {
        active:true,
        margin: 2,
        trigger: {
          callback: undefined,
          offset: 0
        }
      },
      horizontal: {
        active:true,
        margin:2,
        trigger: {
          callback: undefined,
          offset: 0
        }
      }
    }
```
