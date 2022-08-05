import { DataTable } from "react-native-paper";
import React from "react";


export default function Table({ 
	onRowClick = () => null, overwriteRender = false, 
	columns = [], data = [] }) {

	const renderItem = overwriteRender !== false ? overwriteRender : (item) =>  {
		return(		
			<DataTable.Row onPress={() =>{ onRowClick(item) }} key={item.id}>
				{columns.map((column, index) => (
					<DataTable.Cell key={index}>
					{item[column]}
					</DataTable.Cell>
				))}
			</DataTable.Row>
		)
	}

	return (
	<DataTable style={{margin: 10}} >

		<DataTable.Header>
			{columns.map(column => (
				<DataTable.Title key={column}>{column}</DataTable.Title>
			))}	
		</DataTable.Header>

		{data.map((item) => (
			renderItem(item)
		))}
		

	</DataTable>
	)
}