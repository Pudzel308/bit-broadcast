import React, { useState } from 'react';
import { Text, Pressable, StyleSheet } from 'react-native';

type Props = {
    text: string;
    numberOfLines?: number;
};

export default function CollapsibleText({ text, numberOfLines = 3 }: Props) {
    const [expanded, setExpanded] = useState(false);
    const [showReadMore, setShowReadMore] = useState(false);

    return (
        <>
            <Text
                numberOfLines={expanded ? undefined : numberOfLines}
                onTextLayout={(e) => {
                    if (e.nativeEvent.lines.length > numberOfLines) {
                        setShowReadMore(true);
                    }
                }}
                style={styles.text}
            >
                {text}
            </Text>

            {showReadMore && (
                <Pressable onPress={() => setExpanded(!expanded)}>
                    <Text style={styles.readMore}>
                        {expanded ? 'Show less' : 'Show more...'}
                    </Text>
                </Pressable>
            )}
        </>
    );
}

const styles = StyleSheet.create({
    text: {
        fontSize: 16,
        lineHeight: 22,
    },
    readMore: {
        color: '#555',
        marginTop: 4,
        fontWeight: '500',
    },
});
