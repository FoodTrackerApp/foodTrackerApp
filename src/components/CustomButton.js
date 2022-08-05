import { View } from "react-native";
import { Button } from "react-native-paper";

import React, { useState, useEffect } from "react";

export default function CustomButton({ 
    onClick=() => null, text="tap me", 
    altText="click me" ,isAlt=false, 
    isLoading=false, icon="", type="primary",
    ghost=false
    }) {

    const [style, setStyle] = React.useState({});

    useEffect(() => {

        let style = {
            backgroundColor: "#5bc569", 
            borderColor: "#5bc569", 
            borderRadius: 10, 
            borderWidth: 2, 
            marginTop: 10 
        };

        switch(type) {
            case "warning":
                style={
                    backgroundColor: "#f5a524", 
                    borderColor: "#f5a524",
                    borderRadius: 10, 
                    borderWidth: 2, 
                    marginTop: 10 
                }
            break;
            case "error":
                style={
                    backgroundColor: "#f31260", 
                    borderColor: "#f31260", 
                    borderRadius: 10, 
                    borderWidth: 2, 
                    marginTop: 10 
                };
            break;
        }

        if(ghost) {
            console.log("test")
            style.backgroundColor = "transparent";
        }

        setStyle(style);
    }, [type])

    return(
        <View style={style}>
            <Button onPress={onClick} color="white" icon={icon}>
                {isAlt ? text : altText}
            </Button>
        </View>
    )
}