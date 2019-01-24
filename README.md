# Liquid Tank

Simple widget for displaying data from liquids.

### Options

|       Property | Description                                                  | Type     | Default |
| -------------: | ------------------------------------------------------------ | -------- | ------- |
|            min | Minimum value                                                | Number   | 0       |
|            max | Maximum value                                                | Number   | 1       |
|       segments | List of segments.                                            | Array    | [ ]     |
|      fillStyle | Style of the tank fill. Either "solid" or "segmented".       | String   | "solid" |
|           dark | When set to true it adjusts colors for a darker background.  | Boolean  | false   |
|     fontFamily | Font family for the displayed value                          | String   | Arial   |
|       fontSize | Font size for the displayed value                            | Number   | 20      |
| valueFormatter | Function used to format the displayed value. Must return a string. | Function |         |

### Example

```javascript
var element = document.getElementById("widget");
var liquidTank = new LiquidTank(element, {
    min: 0,
    max: 100,
    fillStyle: 'solid',
    segments: [
        {
            color: "#00FF00",
            startValue: 0,
            endValue: 90
        },
        {
            color: "#FF0000",
            startValue: 90,
            endValue: 100
        }
    ],
    dark: false,
    fontFamily: 'Arial',
    fontSize: 20,
    valueFormatter: function (value) {
        return value + ' L';
    }
});

liquidTank.setValue(80);
```
